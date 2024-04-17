const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

router.route("/register").post(authController.register);
router.route("/ssoRegister").post(authController.googleSSORegister);
router.route("/login").post(authController.login);
router.route("/mobile/login").post(authController.mobile_login);
router.route("/refresh-token").post(authController.refreshToken);
router.route("/sendMobileOtp").post(authController.mobile_otp);
router.route("/forgotPassword").post(authController.forgot_password);
router.route("/sendEmailOtp").post(authController.send_otp_mail);
router.route("/verifyOtp").post(authController.verify_otp);
router.route("/verifyApiAccessToken").post(authController.verifyMainAccessToken);




module.exports = router;