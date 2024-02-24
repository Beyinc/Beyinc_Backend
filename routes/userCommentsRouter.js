const express = require("express");
const router = express.Router();
const userCommentController = require('../controllers/userCommentsController')

router.route("/addUserComment").post(userCommentController.addUserComment);
router.route("/getUserComment").post(userCommentController.getUserComment);


router.route("/likeComment").patch(userCommentController.likeComment);
router.route("/dislikeComment").patch(userCommentController.DislikelikeComment);


module.exports = router;