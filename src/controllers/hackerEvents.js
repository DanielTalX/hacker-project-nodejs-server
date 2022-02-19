const express = require('express');
const { getHackerEventModel } = require('../data_access/modelFactory');
const { mapHackerEventToObj, rangeDateValidation, mapToHackerEvent, hackerEventValidation } = require('../validation/validationSchemasJoi');
const { hasPerms } = require('../data_access/rbac');

const router = express.Router();

router.get('/check', (req, res) => {
  res.send({ message: "tests/check all good" });
});


router.get('/',
  hasPerms('readAny', 'event'),
  (async (req, res) => {
    console.log('we are on HackerEvent');
    try {
      // const items = await HackerEvent.find();
      const HackerEvent = await getHackerEventModel("hackerEvent", "query");
      const items = await HackerEvent.find();
      const mapedItmes = items.map(function (i) {
        return mapHackerEventToObj(i);
      });

      // console.log('mapedItmes[0] = ', mapedItmes[0]);
      res.json(mapedItmes);
    } catch (error) {
      console.error('error = ', error);
      res.status(500).json({ message: "failed to get events." });
    }
  }));


// #route:  GET /range
// #desc:   Get all HackerEvents in range
// #access: Private - with read any event permission
router.get('/range',
  hasPerms('readAny', 'event'),
  (async (req, res) => {
    try {
      const { start, end } = req.query;
      const query = { start: { $gte: new Date(2007, 0, 1) } };

      if (start && end) {
        // input validation against injection attacks
        const startDate = new Date(start);
        const endDate = new Date(end);
        const validationError = rangeDateValidation({ startDate, endDate });
        if (validationError)
          return res.status(400).send(validationError);

        // Use built-in mongo db protection tools instead of running a raw query.
        query.start = { $gte: startDate, $lte: endDate };
      }

      console.log('query = ', query);
      const HackerEvent = await getHackerEventModel("hackerEvent", "query");
      const items = await HackerEvent.find(query);
      const mapedItmes = items.map(function (i) {
        return mapHackerEventToObj(i);
      });

      res.json(mapedItmes);
    } catch (error) {
      console.log("There was an error retrieving HackerEvent items: " + error);
      res.status(500).send("There was an error retrieving HackerEvent items.  Please try again later");
    }
  }));


// #route:  GET /:id
// #desc:   Get HackerEvents by id
// #access: Private - with read any event permission
router.get('/:id',
  hasPerms('readAny', 'event'),
  (async (req, res) => {
    try {
      const HackerEvent = await getHackerEventModel("hackerEvent", "query");
      const item = await HackerEvent.findById(req.params.id);
      const mapedItem = mapHackerEventToObj(item)
      res.json(mapedItem);
    } catch (error) {
      console.log("Error on get /:id error = ", error);
      return res.status(500).send("failed to get this event.");
    }
  }));


// #route:  post /
// #desc:   add HackerEvent
// #access: Private - with createOwn event permission
router.post('/',
  hasPerms('createOwn', 'event'),
  (async (req, res) => {
    try {
      const HackerEvent = await getHackerEventModel("hackerEvent", "add");
      const item = mapToHackerEvent(req.body);

      const validationError = hackerEventValidation(item);
      if (validationError) {
        return res.status(400).send(validationError);
      }

      const hackerEvent = new HackerEvent(item);
      const savedItem = await hackerEvent.save();
      res.json(savedItem);
    } catch (error) {
      console.log("Error on post / error = ", error);
      return res.status(500).send("failed to add this event.");
    }
  }));


// #route:  Delete /:id
// #desc:   Delete HackerEvent by id
// #access: Private - with deleteAny event permission
router.delete('/:id',
  hasPerms('deleteAny', 'event'),
  (async (req, res) => {
    try {
      const HackerEvent = await getHackerEventModel("hackerEvent", "delete");
      const removedItem = await HackerEvent.findByIdAndRemove(req.params.id);
      res.json(removedItem);
    } catch (error) {
      console.log("Error on delete /:id error = ", error);
      return res.status(500).send("failed to delete this event.");
    }
  }));

  
// #route:  Patch /:id
// #desc:   Update HackerEvent by id
// #access: Private - with updateAny event permission
router.patch('/:id',
  hasPerms('updateAny', 'event'),
  (async (req, res) => {
    try {
      const HackerEvent = await getHackerEventModel("hackerEvent", "update");
      const item = mapToHackerEvent(req.body);
      const validationError = hackerEventValidation(item);
      if (validationError) {
        return res.status(400).send(validationError);
      }

      const updatedItem = await HackerEvent.updateOne(
        { _id: req.params.id },
        { $set: item }
      );
      res.json(updatedItem);
    } catch (error) {
      console.log("Error on patch /:id error = ", error);
      return res.status(500).send("failed to update this event.");
    }
  }));


module.exports = router;