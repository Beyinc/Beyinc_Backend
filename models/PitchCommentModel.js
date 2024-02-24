const mongoose = require("mongoose");

const PitchCommentSchema = new mongoose.Schema(
    {
        pitchId: { type: String },
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
            ref: "PitchComment",
        },]
    },
    {
        timestamps: true, // This adds 'createdAt' and 'updatedAt' fields
    }
);

const PitchComment = new mongoose.model("PitchComment", PitchCommentSchema);
module.exports = PitchComment;
