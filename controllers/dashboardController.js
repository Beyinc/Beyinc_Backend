const fetch = require("node-fetch");
const Pitch = require("../models/PitchModel");
const Conversation = require("../models/ChatConversationModel");

exports.dashboradDetails = async (req, res, next) => {
  try {
    const pitches = await Pitch.find({
      userInfo: req.payload.user_id,
    });
    const pitchDetail = { approved: 0, pending: 0, rejected: 0 };
    for (let i = 0; i < pitches.length; i++) {
      const pitch = pitches[i];
      pitchDetail[pitch.status] += 1;
    }
    const convoDetail = { Mentor: 0, Admin: 0, Entrepreneur: 0, Investor: 0 };
    const conversations = await Conversation.find({
      members: { $in: [req.payload.user_id] },
    }).populate({ path: "members", select: ["role", "_id"] });
    const convsDetails = {}
    const convsStatsDetails = {}

    let totalConvo = 0;
    let connections_approved = 0;
    let connections_pending = 0;
    for (let i = 0; i < conversations.length; i++) {
      const convo = conversations[i];
     
      const otherMembers = convo.members.filter(
        (v) => v._id.toString() !== req.payload.user_id
      )[0];

      if (otherMembers) {
        if (convo.status == "rejected") continue;
        if (convo.status == "approved") connections_approved += 1;
        if (convo.status == "pending") connections_pending += 1;
        totalConvo += 1;

        if (!convsDetails[otherMembers.role]) {
          convsDetails[otherMembers.role] = { "pending": 0, "approved": 0 }
        }
        if (convo.status == 'pending') {
          convsDetails[otherMembers.role] = { ...convsDetails[otherMembers.role], "pending": convsDetails[otherMembers.role].pending + 1 }
        } else {
          convsDetails[otherMembers.role] = { ...convsDetails[otherMembers.role], "approved": convsDetails[otherMembers.role].approved + 1 }
        }

        if (req.payload.user_id !== convo.requestedTo.toString()) {
          convsStatsDetails[`userCreatedConv-${convo.status}`] = convsStatsDetails[`userCreatedConv-${convo.status}`] ? convsStatsDetails[`userCreatedConv-${convo.status}`] + 1 : 1
        } else {
          convsStatsDetails[`userReceivedConv-${convo.status}`] = convsStatsDetails[`userReceivedConv-${convo.status}`] ? convsStatsDetails[`userReceivedConv-${convo.status}`] + 1 : 1
        }
      }

    }

    return res.status(200).json({
      total_connections: totalConvo,
      total_pitches: pitches.length,
      connections: convsDetails,
      connectionStats: convsStatsDetails,
      pitches: pitchDetail,
      connections_approved,
      connections_pending,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json(err);
  }
};
