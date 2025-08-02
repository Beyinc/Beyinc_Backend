const express = require("express");
const router = express.Router();
const postLiveChatController = require("../controllers/postLiveChat/index");

// Get chat messages for a post
router.post("/getMessages", postLiveChatController.getPostLiveChatMessages);

// Send a new chat message
router.post("/send", postLiveChatController.sendPostLiveChatMessage);

module.exports = router; 