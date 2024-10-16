// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');

// Route to save bio
router.post('/savedata', userProfileController.saveData);
router.post('/inputFormData', userProfileController.InputFormData);
router.post('/inputEntryData', userProfileController.inputEntryData);


// Add more routes as needed
module.exports = router;
