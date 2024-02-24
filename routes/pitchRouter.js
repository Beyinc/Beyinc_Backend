const express = require("express");
const pitchController = require("../controllers/pitchController");
const router = express.Router();

router.route("/pendingPitch").post(pitchController.fetchPendingPitch);
router.route("/livePitch").get(pitchController.fetchLivePitch);
router.route("/allPitches").get(pitchController.fetchAllPitch);
router.route("/userPitches").get(pitchController.fetchUserPitches);
router.route("/updatePitch").post(pitchController.updateSinglePitch);
router.route("/createPitch").post(pitchController.createPitch);
router.route("/deletePitch").post(pitchController.deletePitch);
router.route("/userLivePitch").get(pitchController.userLivePitch);



// router.route("/addPitchComment").post(pitchController.addPitchComment);
// router.route("/addPitchSubComment").post(pitchController.addPitchSubComment);

router.route("/removePitchComment").post(pitchController.removePitchComment);

router.route("/addIntrest").post(pitchController.addIntrest);
router.route("/removeFromIntrest").post(pitchController.removeFromIntrest);

router.route("/addStar").post(pitchController.addReviewStars);
router.route("/getStar").post(pitchController.getReviewStars);








router.route("/changePitchStatus").post(pitchController.changePitchStatus);
router.route("/recentpitch").post(pitchController.recentPitchOfUser);
router.route("/singlePitch").post(pitchController.fetchSinglePitch);






module.exports = router;