"use strict";
const whitelistApp = ['postman', 'web'];
const whitelistPlatform = ['postman', 'angular'];

//sample app and platform header check
function verifyAppHeader(req, res, next) {
  res.removeHeader("X-Powered-By");
  if (whitelistApp.indexOf(req.headers['app']) < 0)
    return res.status(403).send({});
  if (whitelistPlatform.indexOf(req.headers['platform']) < 0)
    return res.status(403).send({});
  console.log('after verifyAppHeader');
  next();
}

module.exports.verifyAppHeader = verifyAppHeader;
