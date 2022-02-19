const mongoose = require('mongoose');
const Promise = require('bluebird');
const CryptoService = require('../validation/CryptoService');
// https://www.npmjs.com/package/bcrypt
const bcrypt = Promise.promisifyAll(require("bcrypt"));

const UserSchema = mongoose.Schema({
    firstName: {
        type: String, required: true, min: 2, max: 80, match: /^[a-zA-Z,.'-]+/
    },
    lastName: {
        type: String, required: true, min: 2, max: 80, match: /^[a-zA-Z,.'-]+/
    },
    username: {
        type: String, required: true, min: 8, max: 100
    },
    email: {
        type: String, require: true, min: 8, max: 100, index: { unique: true },
        match: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
    },
    password: {
        type: String, required: true, minlength: 10, max: 255,
        match: /(?=.*[a-zA-Z])(?=.*[0-9]+).*/
    },
    created: {
        type: Date, required: true, default: Date.now //Date.now new Date()
    },
    passwordUpdateDate: {
        type: Date, required: true, default: Date.now //Date.now new Date()
    },
    salt: { type: String, length: 8 }, // password salt (same password will be differnt)
    role: { type: String, default: 'user', enum: ["user", "supervisor", "admin"] },
    status: { type: String, default: 'pending', enum: ["pending", "active"] },
    accessToken: { type: String }
});

UserSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        try {
            const salt = CryptoService.getRandomText(8);
            // hash password with salt
            const hash = await bcrypt.hashAsync(this.password+salt, 14);
            // save the hash password in db
            this.password = hash;
            // save the salt that helped create the hash
            this.salt = salt;
            this.PasswordUpdateDate = Date.now;
        } catch (err) {
            return next(err);
        }
    }

    // if (this.isModified("email")) {
    //     try {
    //         console.log("UserSchema pre-save - email = ", this.email);
    //         this.status = 'pending';
    //     } catch (err) {
    //         return next(err);
    //     }
    // }

    return next();
});

// Checks if the password is equal to the real password
UserSchema.methods.passwordIsValid = async function (password) {
    try {
        const salt = this.salt;
        const hash = await bcrypt.hashAsync(password+salt, 14);
        // console.log("UserSchema passwordIsValid - hash = ", hash);
        // console.log("UserSchema passwordIsValid - this.password = ", this.password);
        return await bcrypt.compareAsync(password+salt, this.password);
    }
    catch (err) {
        throw err;
    }
};

/*const User = mongoose.model('user', UserSchema); 
module.exports = User;*/
module.exports.UserSchema = UserSchema;
