const express = require("express");
const { dashboradDetails } = require("../controllers/dashboardController");
const router = express.Router();

router.route("/details").get(dashboradDetails);

module.exports = router;
