// https://www.grc.com/haystack.htm
const express = require('express');
const cors = require('cors');
// https://www.npmjs.com/package/bcrypt
const bcrypt = require('bcrypt');
// https://www.npmjs.com/package/jsonwebtoken
const jwt = require('jsonwebtoken');
// https://www.npmjs.com/package/bluebird
const Promise = require('bluebird');

const ServerSettings = require('../settings/ServerSettingsDev');
const { getUserModel, getLoginModel, getAuthCodeModel } = require('../data_access/modelFactory');
const { registerValidation, loginValidation, resetPasswordValidation } = require('../validation/validationSchemasJoi');
const getStrengthPassword = require('../validation/getStrengthPassword');
const isPasswordExpired = require('../validation/isPasswordExpired');
const CryptoService = require('../validation/CryptoService');
const verifyTokenWhilePending = require('../middleware/verifyTokenWhilePending');


const router = express.Router();


// #route:  POST /register
// #desc:   Register a new user
// #access: Public
router.post('/register', async (req, res) => {
    // First step in protection against brute force attacks
    const delayResponse = response => {
        setTimeout(() => response(), 1000);
    };
    try {
        // Principle of Least Privilege
        const UserQuery = await getUserModel("user", "query");
        const UserAdd = await getUserModel("user", "create");
        const AuthCode = await getAuthCodeModel("authCode", "create");

        const validationError = registerValidation(req.body);
        if (validationError)
            return delayResponse(() => res.status(400).send(validationError));

        const { firstName, lastName, username, email, password } = req.body;
        const profile = { firstName, lastName, username, email };

        const passwordScore = getStrengthPassword(password, profile);
        if (passwordScore < ServerSettings.minPasswordScoreRequired) {
            return delayResponse(() => {
                res.status(400).json({
                    message: "The password is too weak.",
                    passwordScore
                });
            });
        }

        const existingUser = await UserQuery.findOne({ email: email });
        if (existingUser) {
            // send email to user
            const emailMessage = `Hello dear customer,
            we wanted to update you that there is currently an attempt to register from your email address to: hacker-project.com.
            We want to make sure that you are the one who tried to sign up, and update you that you already have an account with this email on our site. If you have forgotten your password, you can reset your password.
            If this is not you, someone may be trying to impersonate you, for more details you can contact us.
            Regards,
            Hacker-project team.`;

            /*const data = {
                from: `YOUR NAME <${ServerSettings.EMAIL_USERNAME}>`,
                to: email,
                subject: "Attempt to register for the hacker-project.com website",
                text: emailMessage,
            };
            // send mail with defined transport object
            await emailService.sendMail(data);*/

            // The message that will be displayed on the site
            const webUserMessage = `Hello dear customer, we wanted to update you that we have sent you an email to verify your identity.`;
            return delayResponse(() => res.json({ emailMessage, webUserMessage }));
        }

        const user = new UserAdd({
            firstName: firstName,
            lastName: lastName,
            username: username,
            email: email,
            password: password,
            // role: 'admin' // #debug
        });

        const accessToken = jwt.sign({
            userId: user._id,
            userRole: user.role,
            userStatus: user.status,
        },
            ServerSettings.JWT_SECRET,
            { expiresIn: ServerSettings.session.expiresInSeconds }
        );
        user.accessToken = accessToken;

        const savedUser = await user.save();
        console.log('savedUser = ', savedUser);

        // send *secure* activation link
        const secretCode = CryptoService.getRandomText();
        const hashCode = await CryptoService.hashText(secretCode);
        const { keyHex, ivHex, encryptedText } = CryptoService.encryptText(user._id);
        console.log('{ keyHex, ivHex, encryptedText } = ', { keyHex, ivHex, encryptedText });
        const newCode = new AuthCode({
            userId: user._id,
            hashCode: hashCode,
            keyHex: keyHex,
            ivHex: ivHex,
            cause: 'verify-account'
        });
        await newCode.save();
        console.log('newCode = ', newCode);

        const baseUrl = req.protocol + "://" + req.get("host");
        const emailMessage = `Please use the following link within the next 1 hour to activate your account on Hacket-project.com: ${baseUrl}/api/cs/auth/verification/verify-accoun/${email}t/${encryptedText}/${secretCode}`;
        const webUserMessage = `Hello dear customer, we wanted to update you that we have sent you an email to verify your identity.`;
        /*const data = {
            from: `YOUR NAME <${ServerSettings.EMAIL_USERNAME}>`,
            to: user.email,
            subject: "Your Activation Link for Hacker-Project",
            text: emailMessage,
        };
        // send mail with defined transport object
        await emailService.sendMail(data);*/
        return res.json({ emailMessage, webUserMessage, requestId: encryptedText, requestCode: secretCode });

    } catch (error) {
        console.log("Error on /auth/register: ", error);
        delayResponse(() => res.status(500).send("There was an error attempting to register. Please try again later."));
    }
});


// #route:  POST /Login
// #desc:   Login a user
// #access: Public
router.post('/login', async (req, res) => {
    // First step in protection against brute force attacks
    const delayResponse = response => {
        setTimeout(() => response(), 2000);
    };

    try {
        // Principle of Least Privilege
        const UserQuery = await getUserModel("user", "query");
        const UserUpdate = await getUserModel("user", "update");
        const LoginQuery = await getLoginModel("login", "query");

        const { username, email, password } = req.body;
        const item = { email, password };
        console.log('item = ', item);
        const validationError = loginValidation(item);
        if (validationError)
            return delayResponse(() => res.status(400).send(validationError));

        const { clientIp } = req;
        const identityKey = `${email}-${clientIp}`;

        // #debug: await LoginQuery.successfulLoginAttempt(identityKey);

        // Second step in defending against brute force attacks - maintaining parallel attacks
        if (await LoginQuery.inProgress(identityKey))
            return delayResponse(() => res.status(500).send("Login already in progress."));

        // Third step in protection - if we have identified a user failed to log in multiple times
        if (!await LoginQuery.canAuthenticate(identityKey)) {
            await LoginQuery.failedLoginAttempt(identityKey);
            return delayResponse(() => res.status(500).send("The account is temporarily locked out."));
        }

        const existingUser = await UserQuery.findOne({ email: email });
        if (!existingUser) {
            await LoginQuery.failedLoginAttempt(identityKey);
            return delayResponse(() => res.status(400).send("Invalid email or password"));
        }

        const validPassword = await existingUser.passwordIsValid(password);
        if (!validPassword) {
            await LoginQuery.failedLoginAttempt(identityKey);
            return delayResponse(() => res.status(400).send("Invalid email or password"));
        }

        if (existingUser.status != 'active') {
            await LoginQuery.successfulLoginAttempt(identityKey);
            return delayResponse(() =>
                res.json({
                    status: existingUser.status,
                    isAuthenticated: false,
                    message: "You must first verify your email. Please check your inbox and try again later."
                }));
        }

        const userInfo = {
            _id: existingUser._id,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            username: existingUser.username,
            email: existingUser.email,
            role: existingUser.role,
            status: existingUser.status,
        };

        req.session.login(userInfo, (err) => {
            if (err)
                return delayResponse(() => res.status(500).send("There was an error logging in. Please try again later."));
        });

        const accessToken = jwt.sign(
            {
                userId: existingUser._id,
                userRole: existingUser.role,
                userStatus: existingUser.status,
            },
            ServerSettings.JWT_SECRET,
            { expiresIn: ServerSettings.session.expiresInSeconds }
        );

        await UserUpdate.findByIdAndUpdate(existingUser._id, { accessToken });

        await LoginQuery.successfulLoginAttempt(identityKey);

        // Encrypt the accessToken before sending it to the user
        const { encryptedText } = CryptoService.encrypt(CryptoService.expandText(accessToken));

        const sendUser = {
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            username: existingUser.username,
            email: existingUser.email,
            isAuthenticated: true,
            status: existingUser.status,
            accessToken: encryptedText,
            role: existingUser.role,
            claims: []
        };

        if (isPasswordExpired(existingUser.passwordUpdateDate))
            sendUser.passwordExpired = true;

        // Now in each user request to the server the encrypt accessToken will appear in the header
        return res.header('accessToken', encryptedText).send(sendUser);

    } catch (err) {
        console.log("Error on /auth/login: ", err);
        res.status(500).semd("There was an error attempting to login. Please try again later.");
    }
});


// #route:  GET /logout
// #desc:   Logout a user
// #access: Public
router.get('/logout', async (req, res) => {
    return new Promise(function (resolve, reject) {
        try {
            if (req.session) {
                req.session.destroy();
                return resolve(res.sendStatus(200));
            }
        }
        catch (err) {
            return reject(res.sendStatus(500));
        }
    });

});


// #route:  GET /verification/verify-account
// #desc:   Verify user's email address
// #access: Public
// requestId = encryptedUserId, requestCode = secretCode
router.get("/verification/verify-account/:email/:requestId/:requestCode",
    async (req, res) => {
        // First step in protection against brute force attacks
        const delayResponse = response => {
            setTimeout(() => response(), 1000);
        };
        try {

            // Principle of Least Privilege
            const UserQuery = await getUserModel("user", "query");
            const UserUpdate = await getUserModel("user", "update");
            const AuthCode = await getAuthCodeModel("authCode", "query");

            const { requestId, requestCode, email } = req.params;
            if (!requestId || !requestCode || !email)
                return delayResponse(() => res.status(400).send("")); // !input

            const user = await UserQuery.findOne({ email: email });
            if (!user)
                return delayResponse(() => res.status(400).send("")); // !user

            const authCode = await AuthCode.findOne({ userId: user._id });

            if (!authCode) return delayResponse(() => res.status(400).send("")); // !authCode
            if (authCode.cause != 'verify-account')
                return delayResponse(() => res.status(400).send("")); // !authCode.cause

            const isEqual = await CryptoService.compareToHash(requestCode, authCode.hashCode)
            if (!isEqual) return delayResponse(() => res.status(400).send("")); // !compareToHash

            let decryptUserId = CryptoService.decrypt(requestId, authCode.keyHex, authCode.ivHex);
            decryptUserId = CryptoService.reduceText(decryptUserId);
            if (decryptUserId != user._id)
                return delayResponse(() => res.status(400).send("")); // !decrypt

            await UserUpdate.updateOne(
                { email: user.email },
                { status: 'active' }
            );
            await AuthCode.deleteMany({ userId: user._id });

            // let redirectPath = `${req.protocol}://${req.get("host")}/account/verified`;
            // res.redirect(redirectPath);
            res.json({ success: true });
        } catch (err) {
            console.log("Error on /auth/verification/verify-account: ", err);
            return delayResponse(() => res.status(400).send("")); // !error
        }
    }
);


// #route:  POST /verification/get-activation-email
// #desc:   Send activation email to registered users email address
// #access: Public
router.post("/verification/get-verify-account-code", async (req, res) => {
    // First step in protection against brute force attacks
    const delayResponse = response => {
        setTimeout(() => response(), 1000);
    };

    try {
        const User = await getUserModel("user", "query");
        const AuthCode = await getAuthCodeModel("authCode", "create");

        const { email } = req.body;
        if (!email) return res.status(400).send("Please provide your registered email address!");

        const user = await User.findOne({ email: email });
        if (!user) {
            // send email to user
            const emailMessage = `Hello dear customer,
            We wanted to update you that there is currently an attempt to get a code to verify your identity
            to the site: hacker-project.com.
            We want to make sure that you are the one who requested the code,
            and to update you that you do not have an account with us at all. So you can register as a new user.
            If it's not you, someone else may be trying to impersonate you.
            For more details you can contact us.
            Regards, Hackers project team.`;

            /*const data = {
                from: `YOUR NAME <${ServerSettings.EMAIL_USERNAME}>`,
                to: email,
                subject: "Attempt get-verify-account-code hacker-project.com",
                text: emailMessage,
            };
            // send mail with defined transport object
            await emailService.sendMail(data);*/

            // The message that will be displayed on the site
            const webUserMessage = `Hello dear customer, we wanted to update you that we have sent you an email to verify your identity.`;
            return delayResponse(() => res.json({ emailMessage, webUserMessage }));
        }

        //if (user.status != 'pending')
        //    return res.send("The provided email address is already verified. please login");

        // send *secure* activation link
        await AuthCode.deleteMany({ userId: user._id });
        const secretCode = CryptoService.getRandomText();
        const hashCode = await CryptoService.hashText(secretCode);
        const { keyHex, ivHex, encryptedText } = CryptoService.encryptText(user._id);
        const newCode = new AuthCode({
            userId: user._id,
            hashCode: hashCode,
            keyHex: keyHex,
            ivHex: ivHex,
            cause: 'verify-account'
        });
        await newCode.save();
        console.log("newCode: ", newCode);

        const baseUrl = req.protocol + "://" + req.get("host");
        const emailMessage = `Please use the following link within the next 1 hour to activate your account on Hacket-project.com: ${baseUrl}/api/cs/auth/verification/verify-accoun/${email}t/${encryptedText}/${secretCode}`;
        const webUserMessage = `Hello dear customer, we wanted to update you that we have sent you an email to verify your identity.`;
        /*const data = {
            from: `YOUR NAME <${ServerSettings.EMAIL_USERNAME}>`,
            to: user.email,
            subject: "Your Activation Link for Hacker-Project",
            text: emailMessage,
        };
        // send mail with defined transport object
        await emailService.sendMail(data);*/
        return res.json({ emailMessage, webUserMessage, requestId: encryptedText, requestCode: secretCode });
    } catch (err) {
        console.log("Error on /auth/verification/get-verify-account-code: ", err);
        return delayResponse(() => res.status(400).send("")); // error
    }
});


// #route:  POST /password-reset/get-code
// #desc:   Reset password of user
// #access: Public
router.post("/password-reset/get-code", async (req, res) => {
    // First step in protection against brute force attacks
    const delayResponse = response => {
        setTimeout(() => response(), 1000);
    };

    try {
        const User = await getUserModel("user", "query");
        const AuthCode = await getAuthCodeModel("authCode", "create");

        const { email } = req.body;
        if (!email) return res.status(400).send("Please provide your registered email address!");

        const user = await User.findOne({ email: email });
        if (!user) {
            // send email to user
            const emailMessage = `Hello dear customer,
            We wanted to update you that there is currently an attempt to reset your password at: hacker-project.com.
            We want to make sure that you are the one who requested the code,
            and to update you that you do not have an account with us at all. So you can register as a new user.
            If it's not you, someone else may be trying to impersonate you.
            For more details you can contact us.
            Regards, Hackers project team.`;

            /*const data = {
                from: `YOUR NAME <${ServerSettings.EMAIL_USERNAME}>`,
                to: email,
                subject: "Attempt to reset password hacker-project.com",
                text: emailMessage,
            };
            // send mail with defined transport object
            await emailService.sendMail(data);*/

            // The message that will be displayed on the site
            const webUserMessage = `Hello dear customer, we wanted to update you that we have sent you an email to verify your identity.`;
            return delayResponse(() => res.json({ emailMessage, webUserMessage }));
        }

        if (user.status != 'active') {
            // send email to user
            const emailMessage = `Hello dear customer,
            We wanted to update you that there is currently an attempt to reset your password at: hacker-project.com.
            We want to make sure that you are the one who requested the code,
            The provided email address is not verified. To reset your password please contact us by email.
            If it's not you, someone else may be trying to impersonate you.
            For more details you can contact us.
            Regards, Hackers project team.`;

            // The message that will be displayed on the site
            const webUserMessage = `Hello dear customer, we wanted to update you that we have sent you an email to verify your identity.`;
            return delayResponse(() => res.json({ emailMessage, webUserMessage }));
        }

        await AuthCode.deleteMany({ userId: user._id });
        // send secure activation link
        const secretCode = CryptoService.getRandomText();
        const hashCode = await CryptoService.hashText(secretCode);
        const { keyHex, ivHex, encryptedText } = CryptoService.encryptText(user._id);
        const newCode = new AuthCode({
            userId: user._id,
            hashCode: hashCode,
            keyHex: keyHex,
            ivHex: ivHex,
            cause: 'password-reset'
        });
        await newCode.save();

        const emailMessage = `Please use the following code within the next 10 minutes to reset your password on Hacker-Project: 
        requestId = ${encryptedText}, secretCode = ${secretCode}`;
        const webUserMessage = `Hello dear customer, we wanted to update you that we have sent you an email to reset your password.`;
        /*const data = {
            from: `YOUR NAME <${ServerSettings.EMAIL_USERNAME}>`,
            to: user.email,
            subject: "Your Password Reset Code for Hacker-Project",
            text: emailMessage,
        };
        // send mail with defined transport object
        await emailService.sendMail(data);*/
        return res.json({ emailMessage, webUserMessage, requestId: encryptedText, requestCode: secretCode });
    } catch (err) {
        console.log("Error on /auth/password-reset/get-code: ", err);
        return delayResponse(() => res.status(400).send("")); // error
        // res.status(400).send("something went wrong. Please try again!");
    }
});


// #route:  POST /password-reset/verify
// #desc:   Verify and save new password of user
// #access: Public
router.post("/password-reset/verify", async (req, res) => {
    // First step in protection against brute force attacks
    const delayResponse = response => {
        setTimeout(() => response(), 1000);
    };

    try {

        const AuthCode = await getAuthCodeModel("authCode", "query");
        const AuthCodeDelete = await getAuthCodeModel("authCode", "delete");
        const User = await getUserModel("user", "update");
        const { email, password, password2, requestCode, requestId } = req.body;
        const item = { email, password, password2, requestCode, requestId };
        console.log('item = ', item);

        const validationError = resetPasswordValidation(item);
        if (validationError) return res.sendStatus(400);

        const passwordScore = getStrengthPassword(password, item);
        if (passwordScore < ServerSettings.minPasswordScoreRequired) {
            return res.status(400).json({
                message: "The password is too weak.",
                passwordScore
            });
        }

        const user = await User.findOne({ email: email });
        if (!user) return delayResponse(() => res.sendStatus(400)); // !user

        const authCode = await AuthCode.findOne({ userId: user._id });

        if (!authCode) return delayResponse(() => res.sendStatus(400)); // !authCode
        if (authCode.cause != 'password-reset')
            return delayResponse(() => res.sendStatus(400)); // !authCode.cause

        console.log("authCode =", authCode);
        if (!CryptoService.compareToHash(requestCode, authCode.hashCode))
            return delayResponse(() => res.sendStatus(400)); // !compareToHash
        //.send("The entered code is not correct. Please make sure to enter the code in the requested time interval.");

        let decryptUserId = CryptoService.decrypt(requestId, authCode.keyHex, authCode.ivHex);
        decryptUserId = CryptoService.reduceText(decryptUserId);
        if (decryptUserId != user._id)
            return delayResponse(() => res.sendStatus(400)); // !decrypt

        user.password = password;
        const updatedUser = await user.save();
        console.log("updatedUser =", updatedUser);
        await AuthCodeDelete.deleteMany({ userId: user._id });

        res.json({ success: true });
    } catch (err) {
        console.log("Error on /auth/password-reset/verify: ", err);
        return delayResponse(() => res.sendStatus(400)); // !err
        // res.status(400).json({ success: false, error: "something went wrong. Please try again!" });
    }
});


// #route:  GET /check
// #desc:   for activate csrf token
// #access: Public
router.get('/check', (req, res) => {
    res.send({ message: "check all good" });
});


module.exports = router;