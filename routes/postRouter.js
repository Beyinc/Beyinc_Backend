const express = require("express");
const postControllers = require("../controllers/postControllers");
const router = express.Router();

router.route("/createPost").post(postControllers.createPost);
router.route("/deletePost").post(postControllers.deletePost);
router.route("/editPost").post(postControllers.editPost);
router.route("/likePost").post(postControllers.likePost);
router.route("/disLikePost").post(postControllers.DisLikePost);
router.route("/getPost").post(postControllers.getPost);
router.route("/addReport").post(postControllers.reportPost);
router.route("/updateReport").post(postControllers.updatereportPost);


module.exports = router;