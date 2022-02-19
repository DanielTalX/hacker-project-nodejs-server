const Promise = require('bluebird');
const connectionProvider = require('./dbConnectionProvider');
const ServerSettings = require('../settings/ServerSettingsDev');
const { UserSchema} = require('../models/User');
const { LoginSchema } = require('../models/Login');
const { HackerEventSchema} = require('../models/HackerEvent');
const { AuthCodeSchema } = require('../models/AuthCode');

const fs = Promise.promisifyAll(require("fs"));

const getUserModel = async function (col, perm) {
    try {
         // const accounts = JSON.parse(await fs.readFileAsync("db.config.json", "utf-8"));
        // const creds = accounts[col][perm];
        const conn = await connectionProvider(ServerSettings.mongoURL);
        // const conn = await connectionProvider(ServerSettings.mongoURL, creds);
        return conn.model("User", UserSchema);
    } catch (err) {
        throw err;
    }
};
module.exports.getUserModel = getUserModel;

const getLoginModel = async function (col, perm) {
    try {
         // const accounts = JSON.parse(await fs.readFileAsync("db.config.json", "utf-8"));
        // const creds = accounts[col][perm];
        const conn = await connectionProvider(ServerSettings.mongoURL);
        // const conn = await connectionProvider(ServerSettings.mongoURL, creds);
        return conn.model("Login", LoginSchema);
    } catch (err) {
        throw err;
    }
};
module.exports.getLoginModel = getLoginModel;

const getAuthCodeModel = async function (col, perm) {
    try {
         // const accounts = JSON.parse(await fs.readFileAsync("db.config.json", "utf-8"));
        // const creds = accounts[col][perm];
        const conn = await connectionProvider(ServerSettings.mongoURL);
        // const conn = await connectionProvider(ServerSettings.mongoURL, creds);
        return conn.model("Code", AuthCodeSchema);
    } catch (err) {
        throw err;
    }
};
module.exports.getAuthCodeModel = getAuthCodeModel;

const getHackerEventModel = async function (col, perm) {
    try {
        // const accounts = JSON.parse(await fs.readFileAsync("db.config.json", "utf-8"));
        // const creds = accounts[col][perm];
        const conn = await connectionProvider(ServerSettings.mongoURL);
        // const conn = await connectionProvider(ServerSettings.mongoURL, creds);
        return conn.model("HackerEvent", HackerEventSchema);
    } catch (err) {
        throw err;
    }
};
module.exports.getHackerEventModel = getHackerEventModel;