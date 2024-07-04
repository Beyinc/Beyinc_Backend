const express = require('express');
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });
const Razorpay = require("razorpay");

const { checkout, paymentVerification } = require('../controllers/paymentController');


const router = express.Router();


router.route("/checkout").post(checkout);

// router.route("/paymentverification").post(paymentVerification);

// API endpoint to get Razorpay API key
router.route('/getkey').get((req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_API_KEY });
});

module.exports = router;
