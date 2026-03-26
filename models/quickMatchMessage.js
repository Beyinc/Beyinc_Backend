const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuickMatchRoom",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuickMatchMessage", schema);