// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const { verifyAccessToken } = require('../helpers/jwt_helpers');

// Route to save bio
router.post('/savedata', userProfileController.saveData);
router.post('/inputFormData', userProfileController.InputFormData);
router.post('/inputEntryData', userProfileController.inputEntryData);
router.post('/saveDocuments', userProfileController.SaveDocuments);
router.post('/saveDocument', userProfileController.SaveDocument);
// router.post('/saveEducationDetails', userProfileController.SaveEducationDetails);

// Routes with verifyAccessToken
router.post('/getabout', userProfileController.ReadAbout);
router.post("/createAbout", userProfileController.CreateAbout);
router.route("/uploadFile").post(userProfileController.uploadResume);
router.post("/getSkills", userProfileController.ReadSkills);
router.post("/deleteskill", userProfileController.DeleteSkill);
router.post("/addSkills", userProfileController.AddSkills);
router.post("/saveEducationDetails", userProfileController.SaveEducationDetails);
router.post("/deleteEducationDetails", userProfileController.DeleteEducationDetails);
router.post("/getExperienceDetails", userProfileController.GetExperienceDetails);
router.post("/deleteExperienceDetails", userProfileController.DeleteExperienceDetails);
router.post("/saveExperienceDetails", userProfileController.SaveExperienceDetails)
router.post("/getEducationDetails", userProfileController.GetEducationDetails);
router.post("/updateEducationDetails", userProfileController.UpdateEducationDetails);
router.post("/updateExperienceDetails", userProfileController.UpdateExperienceDetails);










// Add more routes as needed
module.exports = router;
