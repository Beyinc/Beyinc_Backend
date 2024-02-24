const express = require("express");
const notificationController = require("../controllers/notificationController");
const router = express.Router();

router.route("/getNotification").post(notificationController.fetchNotifications);
router.route("/notificationStatusChange").post(notificationController.changeToRead);




module.exports = router;