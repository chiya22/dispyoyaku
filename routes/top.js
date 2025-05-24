const express = require('express');
const router = express.Router();

const dispyoyaku = require('../model/dispyoyaku');
const floorDisplayService = require('../services/floorDisplayService'); // Import the new service

router.get('/', function (req, res) {

  const time_cur = new Date().getHours();
  dispyoyaku.findByTime(time_cur, (err, retObj) => {
    if (err) {
      // It's generally better to pass the error to an error handler
      // or at least log it and send a user-friendly error page.
      console.error("Error fetching yoyaku data:", err);
      return res.status(500).send("Error fetching data."); // Or render an error page
    }

    // Ensure retObj and retObj[0] are valid before trying to access yoyakus
    const yoyakus = (retObj && retObj[0]) ? retObj[0] : [];

    // Initialize floor data using the service
    let floor = floorDisplayService.initializeFloorData();

    // Format floor data using the service
    if (yoyakus.length !== 0) {
      floor = floorDisplayService.formatFloorData(yoyakus, floor);
    }

    // The logic for padding yoyakus for display remains, as it's view-specific.
    // Ensure yoyakus is an array before calculating page size.
    const page = Array.isArray(yoyakus) ? Math.ceil(yoyakus.length / 14) : 0;
    const yoyakurowcount = Array.isArray(yoyakus) ? yoyakus.length : 0;
    const rowcount = page * 14;

    // It's safer to create a new array for paddedYoyakus if yoyakus needs to be modified for display
    let paddedYoyakus = [...yoyakus]; // Create a shallow copy

    for (let i = 0; i < rowcount; i++) {
      if (yoyakurowcount <= i) { // Corrected condition: if current index is beyond actual data
        paddedYoyakus[i] = { // Use paddedYoyakus here
          name_disp: '　', // Assuming this is an empty/placeholder character
          time_riyou: '　',
          nm_room: '　'
        };
      }
    }

    res.render('top', {
      page: page,
      yoyakus: paddedYoyakus, // Send the padded array to the view
      floor: floor,
    });
  });
});

// initfloorinfo function has been moved to floorDisplayService.js

module.exports = router;
