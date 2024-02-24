const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

router.route("/blockUserschat").post(chatController.chatBlock);

router.route("/addConversation").post(chatController.addConversation);
router.route("/checkConversation").post(chatController.checkConversationBetweenTwo);

router.route("/directConversationCreation").post(chatController.directConversationCreation);
router.route("/getConversation").post(chatController.findUserConversation);
router.route("/getConversationById").post(chatController.findConversationById);

router.route("/changeChatSeen").post(chatController.changeSeenStatus);

router.route("/deleteConversation").post(chatController.deleteUserConversation);
router.route("/getUserRequest").post(chatController.fetchRequest);
router.route("/updateMessageRequest").post(chatController.updateMessageRequest);
router.route("/getFriendByConversationId").post(chatController.getFrienddetailsByConversationId);




router.route("/addMessage").post(chatController.addMessage);
router.route("/deleteMessage").post(chatController.deleteMessage);
router.route("/getMessages").post(chatController.getMessage);
router.route("/getTotalMessages").post(chatController.getTotalMessageCount);







module.exports = router;