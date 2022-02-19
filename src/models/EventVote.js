const mongoose = require('mongoose');

const EventVoteSchema = mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HackerEvent",
        required: true
    },
    voteType: {
        type: String,
        require: true
    },
    voter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

EventVoteSchema.index({voteType: String, voter: String});
module.exports.EventVoteSchema = EventVoteSchema;