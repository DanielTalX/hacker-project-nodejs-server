// Nodejs encryption with CTR
// https://nodejs.org/en/knowledge/cryptography/how-to-use-crypto-module/
const crypto = require('crypto');
const Promise = require('bluebird');
const bcrypt = Promise.promisifyAll(require("bcrypt"));
// https://www.npmjs.com/package/crypto-random-string
// const cryptoRandomString = require("crypto-random-string"); // (x) => "abcdefghi";

const ScheduleService = require("../utils/ScheduleService");


const algorithm = 'aes-256-cbc';
const DEF_KEY = crypto.randomBytes(32);
const DEF_IV = crypto.randomBytes(16);

function encrypt(text, key = DEF_KEY, iv = DEF_IV) {
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        keyHex: key.toString('hex'),
        ivHex: iv.toString('hex'),
        encryptedText: encrypted.toString('hex')
    };
}

function decrypt(encryptedTextHex, keyHex = DEF_KEY.toString('hex'), ivHex = DEF_IV.toString('hex')) {
    let iv = Buffer.from(ivHex, 'hex');
    let key = Buffer.from(keyHex, 'hex');
    let encryptedText = Buffer.from(encryptedTextHex, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

function encryptText(text) {
    const iv = crypto.randomBytes(16);
    const key = crypto.randomBytes(32);
    const expandedtText = expandText(text);
    const { keyHex, ivHex, encryptedText } = encrypt(expandedtText, key, iv);
    return { keyHex, ivHex, encryptedText };
}

function getTodayFromEncryptedText() {
    return text.substring(text.length - 8);
}

function reduceText(text) {
    return text.substring(0, text.length - 8);
}

function expandText(text) {
    const todayStrDate = ScheduleService.convertDateToString(new Date(), 'YYYYMMDD');
    return text + todayStrDate;
}

function getRandomText(length = 10) {
    // return cryptoRandomString({ length: 10 })
    return crypto.randomBytes(length * 6).toString('hex').substring(0, length);
}

async function hashText(text) {
    return await bcrypt.hash(text, 8);
}

async function compareToHash(claimText, originalHashText) {
    return await bcrypt.compareAsync(claimText, originalHashText);
}


module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;
module.exports.encryptText = encryptText;
module.exports.getTodayFromEncryptedText = getTodayFromEncryptedText;
module.exports.reduceText = reduceText;
module.exports.expandText = expandText;
module.exports.getRandomText = getRandomText;
module.exports.hashText = hashText;
module.exports.compareToHash = compareToHash;


