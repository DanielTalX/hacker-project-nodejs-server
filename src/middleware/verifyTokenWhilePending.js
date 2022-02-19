const jwt = require("jsonwebtoken");
const ServerSettings = require("../settings/ServerSettingsDev");
const CryptoService = require('../validation/CryptoService');

// not in used
// middleware to check if the token is valid
const verifyTokenWhilePending = (req, res, next) => {
    
    encryptAccessToken = req.header('accessToken');
    if (!encryptAccessToken) return res.status(401).send('Access Denied');

    // decrypt the encrypt Access Token
    const expandAccessToken = CryptoService.decrypt(encryptAccessToken);
    const accessToken = CryptoService.reduceText(expandAccessToken);

    jwt.verify(accessToken, ServerSettings.JWT_SECRET, (err, user) => {
        if (err) {
            res.sendStatus(401);
        } else {
            req.userId = user.userId;
            req.userRole = user.userRole;
            req.userStatus = user.userStatus;
            next();
        }
    });
};

module.exports = verifyTokenWhilePending;
