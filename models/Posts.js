const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        description: {
            type: String,
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
        },
        reported: {
            type: Boolean,
        },
        openDiscussion: {
            type: Boolean,
        },
        reportBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        reportReason: {
            type: String,
        },
        reportedTime: {
            type: Date
        },
        tags: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],

        disLikes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],

        PitchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pitch'
        }
    },
    {
        timestamps: true, // This adds 'createdAt' and 'updatedAt' fields
    }
);

const Posts = new mongoose.model("Posts", postSchema);
module.exports = Posts;
