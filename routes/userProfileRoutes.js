// routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const userProfileController = require("../controllers/userProfileController");
const { verifyAccessToken } = require("../helpers/jwt_helpers");

// Route to save bio
router.post("/savedata", userProfileController.saveData);
router.post("/inputFormData", userProfileController.InputFormData);
router.post("/inputEntryData", userProfileController.inputEntryData);
// GET users by verified status
router.get(
  "/users/verified/:status",
  userProfileController.getUsersByVerifiedStatusByAdmin,
);

// UPDATE user's verified status
router.patch(
  "/users/:userId/verify",
  userProfileController.updateVerifiedStatusByAdmin,
);
router.post("/startupEntryData", userProfileController.startupEntryData);
router.patch("/updateBeyincProfile", userProfileController.updateBeyincProfile); //update beyincProfile
router.post("/saveDocuments", userProfileController.SaveDocuments);
router.post("/saveDocument", userProfileController.SaveDocument);
// router.post('/saveEducationDetails', userProfileController.SaveEducationDetails);

//  ROUTES - for updating seeking options for startup
router.post("/getSeekingOptions", userProfileController.getSeekingOptions);
router.post("/saveSeekingOptions", userProfileController.saveSeekingOptions);
//fetch startup data

router.get(
  "/startupProfileData/:userId",
  userProfileController.getStartupProfileData,
);

// Routes with verifyAccessToken
router.post("/getabout", userProfileController.ReadAbout);
router.post("/createAbout", userProfileController.CreateAbout);
router.route("/uploadFile").post(userProfileController.uploadResume);
router.post("/getSkills", userProfileController.ReadSkills);
router.post("/deleteskill", userProfileController.DeleteSkill);
router.post("/addSkills", userProfileController.AddSkills);
router.post(
  "/saveEducationDetails",
  userProfileController.SaveEducationDetails,
);
router.post(
  "/deleteEducationDetails",
  userProfileController.DeleteEducationDetails,
);
router.post(
  "/getExperienceDetails",
  userProfileController.GetExperienceDetails,
);
router.post(
  "/deleteExperienceDetails",
  userProfileController.DeleteExperienceDetails,
);
router.post(
  "/saveExperienceDetails",
  userProfileController.SaveExperienceDetails,
);
router.post("/getEducationDetails", userProfileController.GetEducationDetails);
router.post(
  "/updateEducationDetails",
  userProfileController.UpdateEducationDetails,
);
router.post(
  "/updateExperienceDetails",
  userProfileController.UpdateExperienceDetails,
);

router.post('/startup/invite-cofounder', userProfileController.sendCoFounderInvite);
router.post('/startup/verify-cofounder', userProfileController.verifyAndAddCoFounder);
router.get('/founding-team', userProfileController.getFoundingTeam);

// Add more routes as needed
module.exports = router;
