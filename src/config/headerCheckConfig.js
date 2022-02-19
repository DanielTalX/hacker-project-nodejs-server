
'use strict';
const url = require('url');
const whitelistUrl = [ 'http://localhost:3006', 'http://localhost:4200', 'ngrok' ];
const whitelistHost = [ 'localhost://3006', 'http://localhost:4200' ];

module.exports = function () {
    return function (req, res, next) {
        // console.log('headerCheckConfig');

        var method = req.method;
        // if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
        if (method === 'HEAD' || method === 'OPTIONS') {
            return next();
        }

        var origin = getBaseUrl(req.headers.origin);
        var referer = getBaseUrl(req.headers.referer);
        var host = getBaseUrl(req.headers.host);

        var errorMessage;

        if (!origin && !referer) {
            return next();
        }


        if(origin && origin.indexOf('.ngrok.io')>-1){
            console.log('headerCheckConfig - ngrok - origin = ', origin);
            return next();
        }
        else if(referer && referer.indexOf('.ngrok.io')>-1){
            console.log('headerCheckConfig - ngrok - referer = ', referer);
            return next();
        }

        if(host && whitelistHost.indexOf(host) < 0){
            console.log('Invalid host header ', host);
            // return res.status(403).send({});
        }
        
        if (origin && whitelistUrl.indexOf(origin) < 0) {
            errorMessage = 'Invalid origin header ' + origin;
        } else if (referer && whitelistUrl.indexOf(referer) < 0) {
            errorMessage = 'Invalid referer header ' + referer;
        } else if(method === 'GET'){
            return next();
        }else {
            console.log('headerCheckConfig - Origin and referer headers were not present');
            errorMessage = undefined;
        }

        if (errorMessage) {
            res.statusCode = 403;
            //return next(new Error(errorMessage));
            return next(errorMessage);
        } else {
            return next();
        }
    };

    function getBaseUrl(fullUrl) {
        if(!fullUrl) return null;
        var parsedUrl = url.parse(fullUrl);
        return parsedUrl.protocol + '//' + parsedUrl.host;
    }
};
