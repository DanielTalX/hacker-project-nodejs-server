"use strict";

const express = require('express');
const cors = require('cors');

const User = require('../models/User');
const HackerEvent = require('../models/HackerEvent');
const EventVote = require('../models/EventVote');
const { getEventVoteModel, getUserModel, getHackerEventModel } = require('../data_access/modelFactory');

const router = express.Router();

router.get('/check', (req, res) => {
    res.send({ message: "eventVotes/check all good" });
});

router.get('/', async (req, res) => {
    try {
        const HackerEvent = await getTimelineItemModel("hackerEvent", "query");
        const EventVote = await getEventVoteModel("eventVote", "query");
        const popularVotes = await EventVote.aggregate(
            [
                { $match: { voteType: "popular" } },
                { $group: { _id: "$eventId", count: { $sum: 1 } } },
            ]
        );

        await HackerEvent.populate(popularVotes,
            { path: "_id", select: "name" },
            function (err, vts) {
                return vts;
            });

        const data = popularVotes.map(vote => {
            const { count } = vote;
            if (!vote._id) return;

            const { _id, name } = vote._id;
            return {
                eventId: _id,
                name,
                count,
                voteType: "popular"
            };
        });

        return res.json(data);

    } catch (err) {
        res.status(500).send("There was a problem getting the voting results. Please try again later.");
    }
});


router.post('/', async (req, res) => {
    try {
        const EventVoteQuery = await getEventVoteModel("eventVote", "query");
        const EventVoteAdd = await getEventVoteModel("eventVote", "create");
        const UserQuery = await getUserModel("user", "query");
        const { eventId } = req.body;
        const { userInfo = {} } = req.session;

        if (!eventId) {
            return res.status(500).send("Timeline event identification missing.  Please correct and resubmit.");
        }

        const user = await UserQuery.findOne({ _id: userInfo._id });
        if (!user) {
            return res.status(401).send("There is no current user to associate with this vote. Please login and try again.");
        }

        const eventVote = {
            eventId: eventId,
            voteType: "popular",
            voter: user._id
        };

        const existingVote = await EventVoteQuery.findOne(eventVote);

        if (existingVote) {
            return res.status(409).send("A vote for this event has already been cast by this voter.");
        }

        const newEventVote = new EventVoteAdd(eventVote);
        await newEventVote.save()
            .then(function (vote) {

                const data = {
                    eventId: vote.eventId,
                    voter: user.email,
                    voteType: eventVote.voteType
                };

                return res.status(200).json(data);
            })
            .catch(function (err) {
                return res.status(500).send("There was an issue casting a vote for this event. Please try again.");
            });

    } catch (err) {
        return res.status(500).send("There was an issue casting a vote for this event. Please try again.");
    }
});

module.exports = router;