const express = require("express");
// const postControllers = require("../controllers/postControllers");
const postControllers = require('../controllers/postControllers');
const router = express.Router();

router.route("/createPost").post(postControllers.createPost);
router.route("/deletePost").post(postControllers.deletePost);
router.route("/editPost").post(postControllers.editPost);
router.route("/likePost").post(postControllers.likePost);
router.route("/disLikePost").post(postControllers.DisLikePost);
router.route("/getPost").post(postControllers.getPost);
router.route("/getAllPosts").post(postControllers.getAllPosts);
router.route("/getTopTrendingPosts").post(postControllers.getTopTrendingPosts);

router.route("/getUsersPost").post(postControllers.getUsersPost);
router.route("/requestIntoOpenDiscussion").post(postControllers.requestIntoOpenDiscussion);
router.route("/getPostRequestDiscussion").post(postControllers.getPostRequestDiscussion);

router.route("/updaterequestIntoOpenDiscussion").post(postControllers.updaterequestIntoOpenDiscussion);


router.route("/addReport").post(postControllers.reportPost);
router.route("/getReportedPosts").get(postControllers.getReportedPosts);

router.route("/updateReport").post(postControllers.updatereportPost);

router.route('/filterPosts').post(postControllers.filterposts);



module.exports = router;