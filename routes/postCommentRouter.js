const express = require("express");
const router = express.Router();
const postCommentsController = require("../controllers/postCommentsController");

// Add comment with optional file upload
// router
//   .route("/addPostComment")
//   .post(upload.single("file"), postCommentsController.addPostComment);

router
  .route("/addPostComment")
  .post(postCommentsController.addPostComment); 


// Fetch comments for a post
router
  .route("/getPostComment")
  .post(postCommentsController.getPostComment);

// Like/Dislike comments
router
  .route("/likePostComment")
  .patch(postCommentsController.likePostComment);

router
  .route("/DislikePostComment")
  .patch(postCommentsController.DislikePostComment);

module.exports = router;
