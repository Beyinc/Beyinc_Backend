const express = require("express");
const router = express.Router();
const postCommentsController = require('../controllers/postCommentsController')

router.route("/addPostComment").post(postCommentsController.addPostComment);
router.route("/getPostComment").post(postCommentsController.getPostComment);


router.route("/likePostComment").patch(postCommentsController.likePostComment);
router.route("/DislikePostComment").patch(postCommentsController.DislikePostComment);


module.exports = router;