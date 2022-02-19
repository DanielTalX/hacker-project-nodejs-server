"use strict";
/* eslint-disable no-console */

const mongoose = require('mongoose');
const Promise = require('bluebird');

mongoose.Promise = Promise;
const _internalConnectionPool = {};

const defaultMongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: true,
};

module.exports = function (url_database, options) {
    
    if (!options) {
        options = defaultMongoOptions;
    }

    const opts = Object.assign({}, {
        //server: {poolSize: 5}
    }, options);

    return new Promise(function(resolve, reject){
        const address = url_database; // `mongodb://${url}/${database}`;
        if (!(_internalConnectionPool[address])) {
            try {
                const conn = mongoose.createConnection(address, opts);
                conn.on("open", function () {
                    _internalConnectionPool[address] = conn;
                    resolve(_internalConnectionPool[address]);
                    console.log("Conncted to mongoDB.");
                });

                conn.on("error", function(err) { console.error("MongoDB error: %s", err); });
            } catch (err) {
                reject(err);
            }
        } else {
            return resolve( _internalConnectionPool[address]);
        }
    });
}
