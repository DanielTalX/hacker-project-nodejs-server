const jwt = require('jsonwebtoken');
const ServerSettings = require('../settings/ServerSettingsDev');
const { getUserModel } = require('../data_access/modelFactory');
const CryptoService = require('../validation/CryptoService');


// middleware to check if the token is valid
async function verifyToken(req, res, next) {
    try {
        console.log('verifyToken - req.url = ', req.url);
        
        // '/auth' and '/tests' are public
        if (req.url.startsWith('/auth') || req.url.startsWith('/tests'))
            return next();

        encryptAccessToken = req.header('accessToken');
        // const accessToken = req.headers["x-access-token"];
        console.log('verifyToken - encryptAccessToken = ', encryptAccessToken);
        if (!encryptAccessToken) return res.status(401).send('Access Denied');

        // decrypt the encrypt Access Token
        const expandAccessToken = CryptoService.decrypt(encryptAccessToken);
        const accessToken = CryptoService.reduceText(expandAccessToken);

        const decoded = jwt.verify(accessToken, ServerSettings.JWT_SECRET);
        console.log("verifyToken - decoded  = ", decoded);

        const { userId, userStatus, exp } = decoded;
        // If token has expired
        if (exp < Date.now().valueOf() / 1000) {
            return res.status(401).json({
                error: "JWT token has expired, please login to obtain a new one"
            });
        }

        // If the user has not yet verified his identity
        if (userStatus != 'active')
            return res.status(401).json({ error: "please verify your email" });

        const User = await getUserModel("user", "query");
        const user = await User.findById(userId);

        if (!user || user.status != 'active')
            return res.status(401).json({ error: "please verify your email" });

        // save the user in session
        req.session.userInfo = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
        };
        console.log("verifyToken - end");
        next();
    } catch (error) {
        console.log("Error on verifyToken: ", error);
        res.status(400).send('Invalid Token');
    }
};

module.exports = verifyToken;