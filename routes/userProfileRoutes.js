// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');

// Route to save bio
router.post('/savebio', userProfileController.saveBio);

// Add more routes as needed
module.exports = router;
