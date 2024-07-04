const express = require("express");
const paymentController = require("../controllers/paymentController");
const router = express.Router();

router.route("/orders").post(paymentController.orders);
router.route("/success").post(paymentController.success);
router.route("/api/users/:userId/:type/balance").get(paymentController.fetchUserBalance);
router.route("/transferCoins").post(paymentController.transferCoins);
router.route("/payouts/transfer").post(paymentController.payOutTransfer)


module.exports = router;