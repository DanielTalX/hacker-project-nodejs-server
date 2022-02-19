const express = require('express');
const { getTestModel } = require('../data_access/modelFactory');
const Test = require('../models/Test');

const router = express.Router();

router.get('/check2', (req, res) => {
  res.send('we are on tests/check2');
});

router.get('/check', (req, res) => {
  res.send({ message: "tests/check all good" });
});

router.get('/', async (req, res) => {
  console.log('we are on tests');
  try {
    const Test = await getTestModel("test", "query");
    const tests = await Test.find();
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: "failed to get tests." });
  }
});

router.get('/:testId', async (req, res) => {
  console.log(req.params.testId);
  try {
    const Test = await getTestModel("test", "query");
    const test = await Test.findById(req.params.testId);
    res.json(test);
  } catch (error) {
    res.status(500).json({ message: "failed to get this event." });
  }
});

router.post('/', async (req, res) => {
  try {
    const Test = await getTestModel("test", "add");

    const test = new Test({
      title: req.body.title,
      description: req.body.description
    });

    const savedTest = await test.save();
    res.json(savedTest);
  } catch (error) {
    res.status(500).json({ message: "failed to add this test." });
  }
});

router.delete('/:testId', async (req, res) => {
  try {
    const Test = await getTestModel("test", "delete");
    const removedTest = await Test.findByIdAndRemove(req.params.testId);
    res.json(removedTest);
  } catch (error) {
    res.status(500).json({ message: "failed to delete this test." });
  }
});

router.delete('/deleteById/:testId', async (req, res) => {
  try {
    const Test = await getTestModel("test", "delete");
    const removedTest = await Test.remove({ _id: req.params.testId });
    res.json(removedTest);
  } catch (error) {
    res.status(500).json({ message: "failed to get this test." });
  }
});

router.patch('/:testId', async (req, res) => {
  try {
    const Test = await getTestModel("test", "update");
    const updatedTest = await Test.updateOne(
      { _id: req.params.testId },
      { $set: { title: req.body.title } }
    );
    res.json(updatedTest);
  } catch (error) {
    res.status(500).json({ message: "failed to update this test." });
  }
});

module.exports = router;