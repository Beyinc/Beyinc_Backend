const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });

const paymentController = require("../controllers/paymentController");
const { verifyAPiAccessToken, verifyAccessToken } = require("../helpers/jwt_helpers");

const router = express.Router();

router.route("/order").post(paymentController.orders);
router.route("/success").post(paymentController.success);
// router.route("/api/users/:userId/:type/balance").get(paymentController.fetchUserBalance);
// router.route("/transferCoins").post(paymentController.transferCoins);
router.route("/payouts/transfer").post(paymentController.payOutTransfer)
router.route("/addBenificiaryAccount").post(paymentController.addBenificiaryAccount)
router.route("/verification").post(paymentController.paymentVerification);
router.route('/fundaccount').post(paymentController.createFundAccount);
router.route('/deleteFundAccount').post(paymentController.deleteFundAccount);
router.route('/saveWithdrawl').post(paymentController.saveWithdrawls);
router.route('/getTransactions').post(paymentController.getTransactions);


router.post('/savePayoutDetails', paymentController.savePayoutDetails );
router.post('/getPayoutDetails', paymentController.getPayoutDetails);



module.exports = router;