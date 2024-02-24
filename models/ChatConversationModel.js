const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    members: [{

        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'

    }],
    status: {
        type: String
    },
    requestedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    pitchId: {
        type: String
    },
    lastMessageText: {
        type: String
    },
    lastMessageTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    seen: {
        type: String
    },
    chatBlocked: {
        userInfo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        blockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
    }
}, {
    timestamps: true  // This adds 'createdAt' and 'updatedAt' fields
})

const Conversation = new mongoose.model('Conversation', conversationSchema)
module.exports = Conversation;