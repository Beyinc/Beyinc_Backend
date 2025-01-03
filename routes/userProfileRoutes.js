// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const { verifyAccessToken } = require('../helpers/jwt_helpers');

// Route to save bio
router.post('/savedata', userProfileController.saveData);
router.post('/inputFormData', userProfileController.InputFormData);
router.post('/inputEntryData',verifyAccessToken, userProfileController.inputEntryData);
router.post('/saveDocuments', userProfileController.SaveDocuments);
// router.post('/saveEducationDetails', userProfileController.SaveEducationDetails);

// Routes without verifyAccessToken
router.post('/getabout', verifyAccessToken, userProfileController.ReadAbout);
router.post("/createAbout", verifyAccessToken, userProfileController.CreateAbout);
router.route("/uploadFile").post(userProfileController.uploadResume);
router.post("/getSkills",verifyAccessToken, userProfileController.ReadSkills);
router.post("/deleteskill",verifyAccessToken, userProfileController.DeleteSkill);
router.post("/addSkills",verifyAccessToken, userProfileController.AddSkills);
router.post("/saveEducationDetails",verifyAccessToken, userProfileController.SaveEducationDetails);
router.post("/deleteEducationDetails",verifyAccessToken, userProfileController.DeleteEducationDetails);
router.post("/getExperienceDetails",verifyAccessToken, userProfileController.GetExperienceDetails);
router.post("/deleteExperienceDetails",verifyAccessToken, userProfileController.DeleteExperienceDetails);
router.post("/saveExperienceDetails",verifyAccessToken, userProfileController.SaveExperienceDetails)
router.post("/getEducationDetails", verifyAccessToken, userProfileController.GetEducationDetails);
router.post("/updateEducationDetails",verifyAccessToken, userProfileController.UpdateEducationDetails);
router.post("/updateExperienceDetails",verifyAccessToken, userProfileController.UpdateExperienceDetails);









// Add more routes as needed
module.exports = router;
