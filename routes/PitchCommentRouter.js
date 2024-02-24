const express = require("express");
const router = express.Router();
const pitchCommentController = require('../controllers/pitchCommentsController')

router.route("/addPitchComment").post(pitchCommentController.addPitchComment);
router.route("/getPitchComment").post(pitchCommentController.getPitchComment);


router.route("/likePitchComment").patch(pitchCommentController.likePitchComment);
router.route("/dispitchlikeComment").patch(pitchCommentController.DispitchlikelikeComment);


module.exports = router;