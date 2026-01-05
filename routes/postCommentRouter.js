const express = require("express");
const router = express.Router();
const postCommentsController = require("../controllers/postCommentsController");
const { verifyAccessToken } = require("../helpers/jwt_helpers");

// ============ PUBLIC ROUTES ============
// Guests can view comments
router
  .route("/getPostComment")
  .post(postCommentsController.getPostComment);

// ============ PROTECTED ROUTES ============
// Only logged-in users can add/like/dislike comments
router
  .route("/addPostComment")
  .post(verifyAccessToken, postCommentsController.addPostComment);

router
  .route("/likePostComment")
  .patch(verifyAccessToken, postCommentsController.likePostComment);

router
  .route("/DislikePostComment")
  .patch(verifyAccessToken, postCommentsController.DislikePostComment);

module.exports = router;
