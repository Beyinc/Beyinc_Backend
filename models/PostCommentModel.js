const mongoose = require("mongoose");

const PostCommentsSchema = new mongoose.Schema(
    {
        postId: { type: String },
        parentCommentId: { type: String },
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
        },
        subComments: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "PostComments",
        },]
    },
    {
        timestamps: true, // This adds 'createdAt' and 'updatedAt' fields
    }
);

const PostComments = new mongoose.model("PostComments", PostCommentsSchema);
module.exports = PostComments;
