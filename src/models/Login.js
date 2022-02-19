const mongoose = require('mongoose');

const LoginSchema =  mongoose.Schema({
    identityKey: { 
        type: String, required: true, index: { unique: true } },
    failedAttempts: {
        type: Number, required: true, default: 0 },
    timeout: {
        type: Date, required: true, default: Date.now },
    inProgress: {
        type: Boolean, default: false }
});

// Checks if the user is already trying to log in,
// and also updates that there is now an attempt to log in
LoginSchema.static("inProgress", async function(key) {
    const login = await this.findOne({identityKey: key});
    const query = {identityKey: key};
    const update = {inProgress: true};
    const options = {setDefaultsOnInsert: true, upsert: true};
    await this.findOneAndUpdate(query, update, options);
    return (login && login.inProgress);
});

// Checks if the user can try to log in
LoginSchema.static("canAuthenticate", async function (key) {
    const login = await this.findOne({identityKey: key});

    // If this is the first time the user is trying to log in
    // or the number of attempts to connect is not too "large",
    // allow the user to try to connect.
    if (!login || login.failedAttempts < 5 )
        return true;

    // check if the user has completed his blocking time
    const timeout = new Date() - new Date(login.timeout) - 1 * 60 * 1000; // one minute
    if (timeout >= 0) {
        await login.remove();
        return true;
    }

    // Otherwise the user can not log in
    return false;
});

// Increases the number of failed attempts by the user to log in
LoginSchema.static("failedLoginAttempt", async function (key) {
    const query = {identityKey: key};
    const update = {$inc: {failedAttempts: 1}, timeout: new Date(), inProgress: false};
    const options = {setDefaultsOnInsert: true, upsert: true};
    return await this.findOneAndUpdate(query, update, options).exec();
});

LoginSchema.static("successfulLoginAttempt", async function (key) {
    const login = await this.findOne({identityKey: key});
    if (login) {
        return await login.remove();
    }
});
module.exports.LoginSchema = LoginSchema;
