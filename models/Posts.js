const mongoose = require("mongoose");
// category date private/public
const postSchema = new mongoose.Schema(
  {
    description: {
      type: String,
    },
    link: {
      type: String,
    },
    visibility: {
      type: String,
      enum: ["public", "private"], // Only allows these two values
      default: "public", // Default to public if not specified
    },

    image: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "Idea Discussion",
        "Co-founder Needed",
        "Tech Partner Needed",
        "Mentor Needed",
        "General Post",
        "Question and Answer",
        "Announcement",
        "News",
        "Hiring",
        "Opportunities",
        "Investment",
      ],
    },
    postTitle: {
      type: String,
    },
    fullDetails: {
      type: String,
    },
    groupDiscussion: {
      type: String,
    },
    reported: {
      type: Boolean,
    },
    openDiscussion: {
      type: Boolean,
    },
    openDiscussionTeam: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    openDiscussionRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reportBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reportedTime: {
          type: Date,
        },
        reason: {
          type: String,
        },
        reportType: {
          type: String,
        },
      },
    ],

    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // reactions
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    innovative: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    unique: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    disLikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    pitchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pitch",
    },
  },
  {
    timestamps: true, // This adds 'createdAt' and 'updatedAt' fields
  }
);

const Posts = new mongoose.model("Posts", postSchema);
module.exports = Posts;
