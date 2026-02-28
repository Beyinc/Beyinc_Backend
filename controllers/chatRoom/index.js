const User = require("../../models/UserModel");
const QuickMatchRoom = require("../../models/quickMatchRoomSchema");
const { normalizeUserForMatching, findSuitableRoom } =
  require("./service");

// exports.quickMatch = async (req, res) => {

//   const user = await User.findById(req.payload.user_id);

//   if(!user) {
//     return res.status(404).json({ error: "User not found" });
//   }
//   const normalUser = normalizeUserForMatching(user);

//   let room = await findSuitableRoom(normalUser);

//   // CREATE ROOM
//   if (!room) {

//     room = await QuickMatchRoom.create({
//       name: `Collab Room ${Math.floor(Math.random()*1000)}`,
//       participants: [{
//         userId: normalUser.userId,
//         experience: normalUser.experience,
//       }],
//       sharedSkills: normalUser.skills,
//       sharedIndustries: normalUser.industries,
//       sharedInterests: normalUser.interests,
//       minExperience: normalUser.experience,
//       maxExperience: normalUser.experience,
//     });

//     return res.json({ room, created: true });
//   }

//   // JOIN ROOM
//   room.participants.push({
//     userId: normalUser.userId,
//     experience: normalUser.experience,
//   });

//   room.minExperience = Math.min(
//     room.minExperience,
//     normalUser.experience
//   );

//   room.maxExperience = Math.max(
//     room.maxExperience,
//     normalUser.experience
//   );

//   if (room.participants.length >= room.maxParticipants)
//     room.isLocked = true;

//   await room.save();

//   res.json({ room, created: false });
// };
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

  const { roomId, message } = req.body;

  const msg = await QuickMatchMessage.create({
    roomId,
    senderId: req.user._id,
    message
  });

  res.json(msg);
};

exports.getMessages = async (req,res)=>{

  const { roomId } = req.params;

  const messages = await QuickMatchMessage
    .find({ roomId })
    .sort({ createdAt: 1 });

  res.json(messages);
};