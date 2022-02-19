const cors = require('cors');
const express = require('express');

const { verifyAppHeader } = require("../middleware/verifyAppHeader");
const verifyToken = require('../middleware/verifyToken');

const auth = require('../controllers/auth');
const hackerEvents = require('../controllers/hackerEvents');
const user = require('../controllers/user');

// api routes (/api/cs)
const routes = express.Router();

// internal middleware
// app.use(cors());
routes.use(verifyAppHeader);
// csrfConfig.csrfConfig(routes);
routes.use(verifyToken);

// public access
routes.use('/auth', auth);
// routes.use('/tests', tests); 

// private access
routes.use('/hackerEvents', hackerEvents);
routes.use('/user', user);
console.log("Initialized routes succesfully.");

module.exports = routes;

