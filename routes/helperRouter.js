const express = require("express");
const { allColleges } = require("../controllers/helpersController");
const router = express.Router();

router.route("/allColleges").post(allColleges);

module.exports = router;
