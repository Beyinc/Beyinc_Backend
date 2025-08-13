const mongoose = require("mongoose");

const postLiveChatMessageSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const PostLiveChatMessage = new mongoose.model("PostLiveChatMessage", postLiveChatMessageSchema);
module.exports = PostLiveChatMessage;
