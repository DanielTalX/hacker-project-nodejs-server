"use strict";

const ServerSettings = {
    port: 3006,
    bodyLimit: "100kb",
    mongoURL: "",
    //db
    serverUrl: "localhost:27017",
    database: "none-db",

    EMAIL_HOST: "smtp.ethereal.email",
    EMAIL_PORT: 465,
    EMAIL_SECURE: true, // true for 465, false for other ports
    EMAIL_USERNAME: "none@gmail.com",
    EMAIL_PW: "some-password",

    //tokens
    cache: {
        password: "a"
    },
    session: {
        password: "a",
        expiresInSeconds: 2 * 60 * 60 // (value * 60 * 60) seconds = hours => 2 hours
    },
    JWT_SECRET: 'a',
    default: 'a',    
    minPasswordScoreRequired: 70,

    //send files - change this
    directoryUrl: 'F:/developer/.../hacker-project/dist/hacker-project',
    indexHtmlUrl: 'F:/developer/.../hacker-project/dist/hacker-project/index.html',
};

module.exports = ServerSettings;