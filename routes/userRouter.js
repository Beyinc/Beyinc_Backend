const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Operations related to users
 * /api/userDetails/getUser:
 *   post:
 *     summary: get User Profile based on email
 *     description: get User Profile based on email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user.
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: User based on the email
 *       400:
 *         description: Invalid request payload
 
 
 
 * /api/userDetails/getUsers:
 *   post:
 *     summary: get All users
 *     description: get All users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: The name of the user.
 *             required:
 *               - type
 *     responses:
 *       200:
 *         description: Users based on the type
 *       400:
 *         description: Invalid request payload
 */

router.route("/getUser").post(userController.getProfile);
router
  .route("/getApprovalRequestProfile")
  .post(userController.getApprovalRequestProfile);

router.route("/getUsers").post(userController.getUsers);

router.route("/verifyUserPassword").post(userController.verifyUserPassword);
router.route("/editprofile").post(userController.editProfile);
router.route("/directeditprofile").post(userController.directeditprofile);
router.route("/updateStatusDirect").post(userController.updateVerificationStatusDirectly);




router.route("/getAllRequests").post(userController.getAllUserProfileRequests);

router.route("/addUserReview").post(userController.addUserReviewStars);
router.route("/getUserReview").post(userController.getUserReviewStars);

// router.route("/addUserComment").post(userController.addUserComment);
router.route("/deleteUserComment").post(userController.removeUserComment);

router.route("/updateVerification").post(userController.updateVerification);
router.route("/updateProfileImage").post(userController.updateProfileImage);
router.route("/deleteProfileImage").post(userController.deleteProfileImage);

router.route("/addPayment").post(userController.addPayment);



module.exports = router;
