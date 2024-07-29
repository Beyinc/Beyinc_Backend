const express = require("express");

const calendarController = require("../controllers/calendarController")
const calenderAuth = require("../helpers/calenderAuth");
const router = express.Router();


const { google } = require('googleapis');
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });



// const oauth2Client = new google.auth.OAuth2(
//     process.env.YOUR_CLIENT_ID,
//     process.env.YOUR_CLIENT_SECRET,
//     process.env.YOUR_REDIRECT_URL
// );

// const scopes = [
//     'https://www.googleapis.com/auth/calendar'
// ];

// // Define the calAuth function directly in the router
// router.route("/calenderAuth").get((req, res) => {
//     console.log('Received request at /calenderAuth');
//     console.log('Client ID:', process.env.YOUR_CLIENT_ID);

//     const url = oauth2Client.generateAuthUrl({
//         access_type: 'offline',
//         scope: scopes
//     });

//     console.log('Redirect URL:', url);

//     // Redirect to the generated URL
//     res.send({url});
// });

router.route("/calendarAuth").get(calenderAuth.calAuth);

router.route("/redirect").get(calendarController.Redirect);

module.exports = router;



// router.route("/calenderController").get(gCalendarCallback);



// module.exports = router;
