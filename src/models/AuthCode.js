const mongoose = require('mongoose');

const AuthCodeSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  hashCode: { type: String, required: true },
  dateCreated: { type: Date, default: Date.now(), expires: (60 * 60) }, // 1 hour
  cause: { type: String, required: true, enum: ["verify-account", "password-reset"] },
  keyHex: { type: String, required: true },
  ivHex: { type: String, required: true },
});

module.exports.AuthCodeSchema = AuthCodeSchema;
