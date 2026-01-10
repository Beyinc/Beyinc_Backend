const express = require('express')
const router = express.Router()
const profileController = require("../controllers/professionalProfileController")

router.route("/update").put(profileController.saveProfileData)
router.route("/fetch").get(profileController.fetchProfileData)

module.exports = router
////