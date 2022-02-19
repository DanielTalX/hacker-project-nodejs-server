"use strict";

const { getHackerEventModel, getUserModel } = require('../data_access/modelFactory');

const { MOCK_HACKER_EVENTS } = require('./hackerEventsMock');
const { MOCK_USERS } = require('./usersMock');


const Promise = require('bluebird');

const initialize = async () => {
    console.log("in initialize");
    try {
        await seedHackerEvents();
        return await seedUsers();
    } catch (err) {
        throw err;
    }
};

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

const seedHackerEvents = async () => {
    const HackerEvent = await getHackerEventModel("hackerEvent", "create");
    const itemsExists = await HackerEvent.find().limit(1);
    console.log("itemsExists = ", !!itemsExists);

    try {
        if (!itemsExists) {
            console.log("seedHackerEvents");
            let itmes = MOCK_HACKER_EVENTS.map(function (i) {
                i.start = new Date(i.start);
                i.end = new Date(i.end);
                return new HackerEvent(i);
            });

            await HackerEvent.insertMany(itmes);
        }
    } catch (err) {
        throw err;
    }
};

const seedUsers = async () => {
    const User = await getUserModel("user", "create");
    const itemsExists = await User.find().limit(1);
    console.log("itemsExists = ", !!itemsExists);

    try {
        if (!itemsExists) {
            console.log("seedUsers");
            let itmes = MOCK_USERS.map(function (i) {
                return new User(i);
            });

            await User.insertMany(itmes);
        }
    } catch (err) {
        throw err;
    }
};

module.exports.initialize = initialize;
