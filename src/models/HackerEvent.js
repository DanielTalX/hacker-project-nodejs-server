const mongoose = require('mongoose');

const HackerEventSchema = mongoose.Schema({
    title: { type: String, required: true, min: 2, max: 30 },
    subtitle: { type: String, max: 100 },
    description: { type: String, required: true, max: 3000 },
    start: { type: Date, required: true, default: Date.now },
    end: { type: Date },
    breachType: { type: String, required: true, min: 2, max: 50 },
    group: { type: String },
    url: { type: String, max: 255 },
    votes: { type: Number, default: 0 },
});
module.exports.HackerEventSchema = HackerEventSchema;

