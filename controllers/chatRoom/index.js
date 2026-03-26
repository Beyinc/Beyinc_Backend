const User = require("../../models/UserModel");
const QuickMatchRoom = require("../../models/quickMatchRoomSchema");
const { normalizeUserForMatching, findSuitableRoom } =
  require("./service");


exports.quickMatch = async (req, res) => {
  try {
    const user = await User.findById(req.payload.user_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const normalUser = normalizeUserForMatching(user);

    let room = await findSuitableRoom(normalUser);

    // CREATE ROOM IF NONE
    if (!room) {
      room = await QuickMatchRoom.create({
        name: `Collab Room ${Math.floor(Math.random() * 1000)}`,
        participants: [], // 🔥 EMPTY NOW
        sharedSkills: normalUser.skills,
        sharedIndustries: normalUser.industries,
        sharedInterests: normalUser.interests,
        minExperience: normalUser.experience,
        maxExperience: normalUser.experience,
      });

      return res.json({
        room,
        created: true,
        joined: false,
      });
    }

    // ONLY SUGGEST ROOM
    res.json({
      room,
      created: false,
      joined: false,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


exports.joinQuickMatchRoom = async (req, res) => {
  try {
    const { roomId } = req.body;

    const user = await User.findById(req.payload.user_id);
    const normalUser = normalizeUserForMatching(user);

    const room = await QuickMatchRoom.findById(roomId);

    if (!room)
      return res.status(404).json({ error: "Room not found" });

    // prevent duplicate join
    const alreadyJoined = room.participants.some(
      p => p.userId.toString() === normalUser.userId.toString()
    );

    if (!alreadyJoined) {
      room.participants.push({
        userId: normalUser.userId,
        experience: normalUser.experience,
      });

      room.minExperience = Math.min(
        room.minExperience,
        normalUser.experience
      );

      room.maxExperience = Math.max(
        room.maxExperience,
        normalUser.experience
      );

      if (room.participants.length >= room.maxParticipants)
        room.isLocked = true;

      await room.save();
    }

    res.json({ room, joined: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Join failed" });
  }
};



const QuickMatchMessage =
  require("../../models/quickMatchMessage");

exports.sendMessage = async (req,res)=>{
  try {
    const { roomId, message, senderName } = req.body;
    const senderId = req.payload.user_id;

    const msg = await QuickMatchMessage.create({
      roomId,
      senderId,
      message
    });

    // Populate sender info
    const populatedMsg = await msg.populate("senderId", "userName email image");

    // Return full message object with sender details
    res.json({
      ...msg.toObject(),
      senderName: senderName || populatedMsg.senderId?.userName || "Anonymous",
    });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

exports.getMessages = async (req,res)=>{
  try {
    const { roomId } = req.params;

    const messages = await QuickMatchMessage
      .find({ roomId })
      .populate("senderId", "userName email image")
      .sort({ createdAt: 1 });

    // Map to include senderName for consistency
    const mappedMessages = messages.map(msg => ({
      ...msg.toObject(),
      senderName: msg.senderId?.userName || "Anonymous"
    }));

    res.json(mappedMessages);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};




exports.getQuickMatchRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.payload.user_id;

    // 1️⃣ Find room + populate participants
    const room = await QuickMatchRoom.findById(roomId)
      .populate({
        path: "participants.userId",
        select: "userName email image industries interests expertise mentorExpertise skills experienceYears",
      });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // 2️⃣ Check user is part of room (security)
    const isParticipant = room.participants.some(
      (p) => p.userId && p.userId._id && p.userId._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        error: "You are not part of this room",
      });
    }

    // 3️⃣ Fetch messages
    const messages = await QuickMatchMessage.find({ roomId })
      .populate("senderId", "name profilePic")
      .sort({ createdAt: 1 });

    // 4️⃣ Response
    res.json({
       room,
      participants: room.participants,
      messages,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch room data" });
  }
};


exports.getUserRooms = async (req, res) => {
  try {
    const userId = req.payload.user_id;

    // Find all rooms where user is a participant
    const rooms = await QuickMatchRoom.find({
      "participants.userId": userId,
    })
      .populate({
        path: "participants.userId",
        select: "userName email image industries interests expertise mentorExpertise skills experienceYears",
      })
      .sort({ updatedAt: -1 });

    if (!rooms || rooms.length === 0) {
      return res.json({ rooms: [], message: "No rooms found" });
    }

    // Fetch latest message for each room
    const roomsWithLastMessage = await Promise.all(
      rooms.map(async (room) => {
        const lastMessage = await QuickMatchMessage.findOne({ roomId: room._id })
          .sort({ createdAt: -1 })
          .populate("senderId", "userName image");

        return {
          ...room.toObject(),
          lastMessage: lastMessage || null,
        };
      })
    );

    res.json({ rooms: roomsWithLastMessage });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user rooms" });
  }
};


exports.leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.payload.user_id;

    if (!roomId) {
      return res.status(400).json({ error: "Room ID is required" });
    }

    const room = await QuickMatchRoom.findById(roomId);

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if user is a participant
    const participantIndex = room.participants.findIndex(
      (p) => p.userId.toString() === userId.toString()
    );

    if (participantIndex === -1) {
      return res.status(400).json({ error: "User is not a participant in this room" });
    }

    // Remove user from participants
    room.participants.splice(participantIndex, 1);

    // Unlock room if it was locked and now has space
    if (room.isLocked && room.participants.length < room.maxParticipants) {
      room.isLocked = false;
    }

    // If no participants left, optionally delete the room or mark it
    if (room.participants.length === 0) {
      await QuickMatchRoom.findByIdAndDelete(roomId);
      return res.json({ 
        message: "Room deleted as it has no participants",
        roomDeleted: true 
      });
    }

    await room.save();

    res.json({ 
      message: "Successfully left the room",
      room,
      roomDeleted: false
    });

  } catch (err) {
    console.error("Leave room error:", err);
    res.status(500).json({ error: "Failed to leave room" });
  }
};