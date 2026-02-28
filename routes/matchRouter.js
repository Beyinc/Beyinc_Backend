const express = require("express");

const {
  quickMatch,
  sendMessage,
  getMessages,joinQuickMatchRoom
//   getUserRooms,
//   leaveRoom,
} = require("../controllers/chatRoom/index");
const router = express.Router();


router.route("/quickMatch").post(quickMatch);
router.route("/joinRoom").post(joinQuickMatchRoom);
/**
 * SEND MESSAGE TO ROOM
 */
router.route("/sendMessage").post(sendMessage);

/**
 * GET ALL MESSAGES OF A ROOM
 */
router.route("/messages/:roomId").get(getMessages);

/**
 * GET ALL ROOMS OF LOGGED IN USER
 */
// router.route("/myRooms").get(getUserRooms);

// router.route("/leaveRoom/:roomId").post(leaveRoom);

module.exports = router;