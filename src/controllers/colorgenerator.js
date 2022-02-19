const express = require('express');
const axios = require('axios');

const router = express.Router();

/**
 * @route: GET /getColors
 * @description: get list of colors
 * @access: public
 */
router.get('/getColors', async (req, res) => {
  // console.log(req.query.size);
  const N = 500;
  let colorsHex = await getColorsHex(N);
  let colorsNames = await getColorsName(colorsHex);
  let colors = {};

  for (let i = 0; i < colorsNames.length; i++) {
    let colorName = colorsNames[i];
    let colorHex = colorsHex[i];
    if (colors[colorName]) {
      colors[colorName].count++;
    } else {
      colors[colorName] = { colorName, colorHex, count: 1 };
    }
  };

  let items = Object.values(colors);
  // console.log("items size = " + items.length);
  // console.log("items > 1: ", items.filter(item => item.count > 1));
  res.status(200).send(items);
});


async function getColorsHex(size) {
  const URL = 'http://www.shodor.org/~ishaanr/PHP/colorgenerator.php?';
  let promisesGetColorHex = Array.from(Array(size)).map(() => axios.get(URL));

  let colorsHex = await Promise.all(promisesGetColorHex)
    .then(function (responses) {
      return responses.map(response => {
        let indexStart = response.data.indexOf('#');
        let indexEnd = response.data.indexOf(';');
        let colorHex = response.data.substring(indexStart + 1, indexEnd - 1);
        return colorHex;
      });
    })
    .catch(error => {
      console.error(error.message);
      return [];
    });
  console.log("colorsHex end");
  return colorsHex;
}

async function getColorsName(colorsHex) {
  const URL = `https://www.thecolorapi.com/id?hex=`;
  let promisesGetColorName = Array.from(Array(colorsHex.length).keys());
  promisesGetColorName = promisesGetColorName.map((i) => axios.get(URL + colorsHex[i]));

  let colorsNames = await Promise.all(promisesGetColorName)
    .then(function (responses) {
      return responses.map(response => response.data.name.value);
    })
    .catch(error => {
      console.error(error.message);
      return [];
    });
  console.log("colorsNames end");
  return colorsNames;
}

module.exports = router;