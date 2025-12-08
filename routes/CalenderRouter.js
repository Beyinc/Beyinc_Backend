const express = require("express");

const availabilityController = require("../controllers/availabilityController");
const calendarController = require("../controllers/calendarController")
const calenderAuth = require("../helpers/calenderAuth");
const router = express.Router();
const requestController=require("../controllers/requestController");

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
router.route("/mentorBookings").post(availabilityController.getBookingsMentor);
router.route("/userBookings").post(availabilityController.getBookingsUser);

router.route("/calendarAuth").get(calenderAuth.calAuth);

router.route("/redirect").get(calendarController.Redirect);
router.route("/book").post(calendarController.book);
router.route("/reschedule").post(calendarController.modifyEventDates);
router.route("/mentorReschedule").post(availabilityController.updateMentorReschedule);
router.route("/cancelBooking").post(calendarController.deleteEvent);
router.route("/addFeedback").post(availabilityController.addFeedback);
router.route("/deleteSingleService").post(availabilityController.deleteSessionById);


// request routes
router.post("/create-request", requestController.createNewRequest);

router.get("/user/pending",requestController.getUserPendingRequests);

router.get("/mentor/pending", requestController.getMentorPendingRequests);

router.put("/update-request", requestController.updateRequestStatusByMentor);

router.delete("/deleteRequestByMentor",requestController.deleteRequestByMentor);

module.exports = router;



// router.route("/calenderController").get(gCalendarCallback);



// module.exports = router;
