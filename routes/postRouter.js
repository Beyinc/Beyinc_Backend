const express = require("express");
const postControllers = require('../controllers/postControllers');
const { verifyAccessToken, optionallyVerifyAccessToken } = require("../helpers/jwt_helpers");

const router = express.Router();

// ============ PUBLIC ROUTES (No Auth Required) ============
// Guests can view posts without logging in
router.route("/getPost").post(optionallyVerifyAccessToken, postControllers.getPost);
router.route("/getAllPosts").post(optionallyVerifyAccessToken, postControllers.getAllPosts);
router.route("/getTopTrendingPosts").post(optionallyVerifyAccessToken, postControllers.getTopTrendingPosts);
router.route("/getUsersPost").post(optionallyVerifyAccessToken, postControllers.getUsersPost);
router.route('/filterPosts').post(optionallyVerifyAccessToken, postControllers.filterposts);
router.route("/getReportedPosts").get(optionallyVerifyAccessToken, postControllers.getReportedPosts);

// ============ PROTECTED ROUTES (Auth Required) ============
// Only logged-in users can perform these actions
router.route("/createPost").post(verifyAccessToken, postControllers.createPost);
router.route("/deletePost").post(verifyAccessToken, postControllers.deletePost);
router.route("/editPost").post(verifyAccessToken, postControllers.editPost);
router.route("/reactToPost").post(verifyAccessToken, postControllers.reactToPost);
router.route("/requestIntoOpenDiscussion").post(verifyAccessToken, postControllers.requestIntoOpenDiscussion);
router.route("/getPostRequestDiscussion").post(verifyAccessToken, postControllers.getPostRequestDiscussion);
router.route("/updaterequestIntoOpenDiscussion").post(verifyAccessToken, postControllers.updaterequestIntoOpenDiscussion);
router.route("/addReport").post(verifyAccessToken, postControllers.reportPost);
router.route("/updateReport").post(verifyAccessToken, postControllers.updatereportPost);

module.exports = router;
