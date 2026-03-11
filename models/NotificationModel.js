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

// after a notification is saved, send an email to the receiver
// this keeps controllers clean and ensures every new notification triggers an email

// require helper and user model inside file to avoid circular dependencies
const send_Notification_mail = require('../helpers/EmailSending');
const User = require('./UserModel');

// capture new document status before saving
NotificationSchema.pre('save', function(next) {
    this._wasNew = this.isNew;
    next();
});

NotificationSchema.post('save', async function(doc) {
    if (!this._wasNew) return;      // sirf new notification
    if (!doc.receiver) return;     // safety check

    try {
        const receiver = await User
            .findById(doc.receiver)
            .select('email userName');

        if (receiver && receiver.email) {
            await send_Notification_mail(
                receiver.email,
                'You have a new notification',
                `<p>${doc.message}</p>`,
                receiver.userName,
                '/notifications'
            );
        }
    } catch (err) {
        console.error('Error sending notification email:', err);
    }
});

const Notification = new mongoose.model('Notification', NotificationSchema)
module.exports = Notification;