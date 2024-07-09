const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });
const paymentController = require("../controllers/paymentController");

const router = express.Router();

router.route("/orders").post(paymentController.orders);
router.route("/success").post(paymentController.success);
router.route("/api/users/:userId/:type/balance").get(paymentController.fetchUserBalance);
router.route("/transferCoins").post(paymentController.transferCoins);
router.route("/payouts/transfer").post(paymentController.payOutTransfer)
router.route("/addBenificiaryAccount").post(paymentController.addBenificiaryAccount)


// router.route("/checkout").post(checkout);

// router.route("/paymentverification").post(paymentVerification);

// API endpoint to get Razorpay API key
router.route('/getkey').get((req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_API_KEY });
});

module.exports = router;