// routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const filterController = require("../controllers/filterController");

// Route to save bio
router.post("/filterdata", filterController.filterData);
router.post("/filterstartups", filterController.filterStartups);

router.post("/filterSearchProfiles", filterController.filterSearch);

// Add more routes as needed
module.exports = router;
