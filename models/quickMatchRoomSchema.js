const mongoose = require("mongoose");

const quickMatchRoomSchema = new mongoose.Schema(
  {
    name: String,

    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        experience: Number,
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    sharedSkills: [String],
    sharedIndustries: [String],
    sharedInterests: [String],

    minExperience: Number,
    maxExperience: Number,

    maxParticipants: {
      type: Number,
      enum: [3,4,5],
      default: 4,
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    lastMessage: String,
    lastMessageAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "QuickMatchRoom",
  quickMatchRoomSchema
);