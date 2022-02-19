"use strict";
const helmet = require("helmet");

const responseHeaderConfig = (app) => {

    app.use(helmet());
    app.use(helmet.hidePoweredBy());

    // Don't allow me to be in ANY frames - Sets "X-Frame-Options: DENY".
    // Only let me be framed by people of the same origin - Sets "X-Frame-Options: SAMEORIGIN".
    app.use(helmet.frameguard({ action: 'deny' }));

    // Sets "X-Content-Type-Options: nosniff".
    app.use(helmet.noSniff());

    app.use(helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'", "http://localhost:3006/", "http://localhost:4200/"],
            scriptSrc: ["'self'", "http://localhost:3006/", "http://localhost:4200/", "https://*.googleapis.com", "https://use.fontawesome.com", "https://www.google-analytics.com", "'unsafe-inline'", "'unsafe-hashes'"],
            styleSrc: ["'self'", "http://localhost:3006/", "http://localhost:4200/", "https://*.googleapis.com", "https://use.fontawesome.com", "'unsafe-inline'", "'unsafe-hashes'"],
            imgSrc: ["'self'", "http://localhost:3006/", "http://localhost:4200/",  "https://*.googleapis.com", "https://www.google-analytics.com"],
            fontSrc: ["'self'", "http://localhost:3006/", "http://localhost:4200/", "https://fonts.gstatic.com", "https://use.fontawesome.com"],
            connectSrc: ["'self'", "http://localhost:3006/", "http://localhost:4200/", "https://*.googleapis.com","https://www.google-analytics.com"],
            frameAncestors: ["'none'"] //self,none
        },
    }));

    // Add headers
    app.use(function (req, res, next) {

        const whitelistUrl = ['http://localhost:4200', 'http://localhost:3006', 'ngrok'];
        var origin = req.headers.origin;
        // console.log("origin = ", origin);

        // postman and web from server
        if (!origin) {
            // return res.status(403).send({ error: "error" });
            res.header("Access-Control-Allow-Origin", "*");
        }

        if (whitelistUrl.indexOf(origin) > -1) {
            // Website you wish to allow to connect
            // res.header("Access-Control-Allow-Origin", "*");
            res.setHeader('Access-Control-Allow-Origin', origin);
        }

        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers',
            "id, accessToken,  XSRF-TOKEN, csrf-token, Authorization, app, platform, device, location, access-control-allow-origin, Content-Type, Accept, Origin, X-Requested-With, Set-Cookie, Cookie");

        res.setHeader('Access-Control-Expose-Headers', 'id', 'accessToken', 'XSRF-TOKEN', 'csrf-token');

        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', true);

        if (req.method === "OPTIONS") {
            return res.status(200).end();
        }

        // Pass to next layer of middleware
        next();
    });
};

module.exports = responseHeaderConfig;