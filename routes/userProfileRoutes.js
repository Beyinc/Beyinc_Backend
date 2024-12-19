// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');

// Route to save bio
router.post('/savedata', userProfileController.saveData);
router.post('/inputFormData', userProfileController.InputFormData);
router.post('/inputEntryData', userProfileController.inputEntryData);
router.post('/saveDocuments', userProfileController.SaveDocuments);
// router.post('/saveEducationDetails', userProfileController.SaveEducationDetails);

// Routes without verifyAccessToken
router.post('/getabout', userProfileController.ReadAbout);
router.post("/createAbout", userProfileController.CreateAbout);
router.post("/getSkills", userProfileController.ReadSkills);
router.post("/saveEducationDetails", userProfileController.SaveEducationDetails);
router.post("/deleteEducationDetails", userProfileController.DeleteEducationDetails);
router.route("/saveExperienceDetails").post(userProfileController.SaveExperienceDetails)
router.post("/deleteExperienceDetails", userProfileController.DeleteExperienceDetails);
router.post("/getExperienceDetails", userProfileController.GetExperienceDetails);
router.post("/getEducationDetails", userProfileController.GetEducationDetails);
router.post("/updateEducationDetails", userProfileController.UpdateEducationDetails);
router.post("/updateExperienceDetails", userProfileController.UpdateExperienceDetails);
router.post("/addSkills", userProfileController.AddSkills);
router.post("/deleteskills", userProfileController.DeleteSkill);









// Add more routes as needed
module.exports = router;
