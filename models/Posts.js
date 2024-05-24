const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        description: {
            type: String,
        },
        link: {
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
        title: {
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
        openDiscussionTeam: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        openDiscussionRequests: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        reportBy: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            reportedTime: {
                type: Date
            },
            reason: {
                type: String
            },
        }],
        
        
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

        pitchId: {
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
