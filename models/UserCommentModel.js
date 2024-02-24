const mongoose = require("mongoose");

const userCommentSchema = new mongoose.Schema(
    {
        userId: {type: String},
        commentBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        Dislikes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        comment: {
            type: String,
        }
    },
    {
        timestamps: true, // This adds 'createdAt' and 'updatedAt' fields
    }
);

const UserComment = new mongoose.model("UserComment", userCommentSchema);
module.exports = UserComment;
