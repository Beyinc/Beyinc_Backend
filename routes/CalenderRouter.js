const express = require("express");

const availabilityController = require("../controllers/availabilityController");
const calendarController = require("../controllers/calendarController")
const calenderAuth = require("../helpers/calenderAuth");
const router = express.Router();


const { google } = require('googleapis');
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });


// router.route("/availability").post(availabilityController.saveAvailability);
router.route("/getAvailabilityData").post(availabilityController.getAvailability);

router.route("/saveSettingsData").post(availabilityController.saveSettings);
router.route("/saveSingleService").post(availabilityController.saveSingleService);
router.route("/createWebinar").post(availabilityController.saveWebinar);
router.route("/addWebinarUser").post(calendarController.addAttendee);


// router.route("/createDm").post(availabilityController.createPriorityDm);



router.route("/saveBooking").post(availabilityController.saveBooking);
router.route("/getBooking").post(availabilityController.getBooking);


router.route("/calendarAuth").get(calenderAuth.calAuth);

router.route("/redirect").get(calendarController.Redirect);
router.route("/book").post(calendarController.book);



module.exports = router;



// router.route("/calenderController").get(gCalendarCallback);



// module.exports = router;
