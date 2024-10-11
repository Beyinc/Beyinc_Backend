// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const filterController = require('../controllers/filterController');

// Route to save bio
router.post('/filterdata', filterController.filterData);

// Add more routes as needed
module.exports = router;
