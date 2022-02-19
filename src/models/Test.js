const mongoose = require('mongoose');

const TestSchema = mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    date: {type: Date, default: Date.now },
});
module.exports.TestSchema = TestSchema;
