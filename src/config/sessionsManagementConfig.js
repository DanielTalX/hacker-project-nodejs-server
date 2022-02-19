"use strict";

const session = require("express-session");
const Promise = require("bluebird");
// https://www.npmjs.com/package/connect-mongo
const mongoStoreFactory = require("connect-mongo");
const dbConnectionProvider = require("../data_access/dbConnectionProvider");
const ServerSettings = require("../settings/ServerSettingsDev");
require('dotenv/config');

const fs = Promise.promisifyAll(require("fs"));

const getAccount = async () => {
    const accounts = JSON.parse(await fs.readFileAsync("db.config.json", "utf-8"));
    return accounts["sessions"]["admin"];
};

module.exports = async function sessionManagementConfig(app) {

    session.Session.prototype.login = function (user, cb) {
        // in order to avoid session fixation attack
        this.req.session.regenerate(function (err) {
            if (err) cb(err);
        });
        // save the user in req session
        this.req.session.userInfo = user;
        cb();
    };

    // const creds = await getAccount();

    app.use(session({
        store: mongoStoreFactory.create({
            // clientPromise: dbConnectionProvider(ServerSettings.mongoURL, creds),
            mongoUrl: ServerSettings.mongoURL,
            mongoOptions: {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            },
            ttl: ServerSettings.session.expiresInSeconds // (default is 14 days!)
        }),

        secret: ServerSettings.session.password,
        saveUninitialized: true, // don't create session until something stored
        resave: false, // don't save session if unmodified
        cookie: {
            path: "/",
            httpOnly: true, // the cookie cannot be accessed throught client side scripts - like: document.cookie
            secure: false, // set to true only in https
            maxAge: (1000 * ServerSettings.session.expiresInSeconds) // 1000 * ttl mongo => milseconds
        },
        name: "id" // instead of "sid" default of session
    }));

    console.log("Conncted to mongoDB.");
}
