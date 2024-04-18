const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    senderInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sender: {
        type: String
    },
    // senderEmail: {
    //     type: String
    // },
    // senderProfile: { type: String },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    message: {
        type: String
    },
    type: {
        type: String
    }, read: {
        type: Boolean
    }, 
    postId: {
        type: String
    }
}, {
    timestamps: true  // This adds 'createdAt' and 'updatedAt' fields
})

const Notification = new mongoose.model('Notification', NotificationSchema)
module.exports = Notification;