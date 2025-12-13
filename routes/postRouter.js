const express = require("express");
// const postControllers = require("../controllers/postControllers");
const postControllers = require('../controllers/postControllers');
const { verifyAccessToken } = require("../helpers/jwt_helpers");

const router = express.Router();

router.route("/createPost").post(verifyAccessToken, postControllers.createPost);
router.route("/deletePost").post(verifyAccessToken, postControllers.deletePost);
router.route("/editPost").post(verifyAccessToken, postControllers.editPost);
router.route("/likePost").post(verifyAccessToken, postControllers.likePost);
router.route("/disLikePost").post(verifyAccessToken, postControllers.DisLikePost);
router.route("/getPost").post(postControllers.getPost);
router.route("/getAllPosts").post(postControllers.getAllPosts);
router.route("/getTopTrendingPosts").post(postControllers.getTopTrendingPosts);

router.route("/getUsersPost").post(postControllers.getUsersPost);
router.route("/requestIntoOpenDiscussion").post(verifyAccessToken, postControllers.requestIntoOpenDiscussion);
router.route("/getPostRequestDiscussion").post(verifyAccessToken, postControllers.getPostRequestDiscussion);

router.route("/updaterequestIntoOpenDiscussion").post(verifyAccessToken, postControllers.updaterequestIntoOpenDiscussion);


router.route("/addReport").post(verifyAccessToken, postControllers.reportPost);
router.route("/getReportedPosts").get(postControllers.getReportedPosts);

router.route("/updateReport").post(verifyAccessToken, postControllers.updatereportPost);

router.route('/filterPosts').post(postControllers.filterposts);



module.exports = router;