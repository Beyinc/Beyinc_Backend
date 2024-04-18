const { authSchema } = require("../helpers/validations");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    signEmailOTpToken,
    verifyEmailOtpToken,
} = require("../helpers/jwt_helpers");
const User = require("../models/UserModel");
const dotenv = require("dotenv");
const Userverify = require("../models/OtpModel");
dotenv.config({ path: "../config.env" });
const twilio = require("twilio");
const UserUpdate = require("../models/UpdateApproval");
const cloudinary = require("../helpers/UploadImage");
const Conversation = require("../models/ChatConversationModel");
const Message = require("../models/MessageModel");
const Pitch = require("../models/PitchModel");
const send_Notification_mail = require("../helpers/EmailSending");
const Notification = require("../models/NotificationModel");


exports.addConversation = async (req, res, next) => {
    try {
        const { pitchId } = req.body;
        const conversationExists = await Conversation.find({
            'members': { $all: [req.body.senderId, req.body.receiverId] }
        })
        if (conversationExists.length == 0) {
            const senderInfo = await User.findOne({ _id: req.body.senderId });
            const receiverInfo = await User.findOne({ _id: req.body.receiverId });
            // adding conversation after pitch done
            await Conversation.create({
                members: [senderInfo._id, receiverInfo._id,
                ], lastMessageTo: req.body.receiverId, seen: '', requestedTo: req.body.receiverId, status: 'pending', pitchId: pitchId
            })

            await send_Notification_mail(receiverInfo.email, `Message Request from ${senderInfo.userName}`, `${senderInfo.userName} sent a message request please check the notification section.`, receiverInfo.userName)
            return res.status(200).send(`Message request sent to ${receiverInfo.userName}`)
        } else {
            const receiverInfo = await User.findOne({ _id: req.body.receiverId });
            const text = conversationExists[0].status == 'pending' ? `Already request sent. It is in ${conversationExists[0].status} status` : `Already conversation approved by ${receiverInfo.userName}`
            return res.status(200).send(text)
        }

    }
    catch (error) {
        console.log(error);
        return res.status(400).send(error)
    }
}

exports.checkConversationBetweenTwo = async (req, res, next) => {
    const conversationExists = await Conversation.find({
        'members': { $all: [req.body.senderId, req.body.receiverId] }
    })
    if (conversationExists.length == 0) {
        return res.status(400).json('No Converstaion')
    }
    return res.status(200).json('conversation exist')
}

// Admin can create direct conversation
exports.directConversationCreation = async (req, res, next) => {
    try {

        const conversationExists = await Conversation.find({
            'members': { $all: [req.body.senderId, req.body.receiverId] }
        })
        if (conversationExists.length == 0) {
            // adding conversation after pitch done
            const senderInfo = await User.findOne({ _id: req.body.senderId });
            const receiverInfo = await User.findOne({ _id: req.body.receiverId });
            await Conversation.create({
                members: [senderInfo._id,
                 receiverInfo._id
                ], seen: '', lastMessageTo: req.body.receiverId, requestedTo: req.body.receiverId, status: req.body.status,
            })
            if (req.body.status == 'pending') {
                await send_Notification_mail(receiverInfo.email, `Message Request from ${senderInfo.userName}`, `${senderInfo.userName} sent a message request please check the notification section.`, receiverInfo.userName)
                return res.status(200).send(`Conversation with ${receiverInfo.userName} created`)
            }
            await Notification.create({ senderInfo: senderInfo._id, receiver: receiverInfo._id, message: `${senderInfo.userName} has created a direct conversation with you.`, type: 'pitch', read: false })
            return res.status(200).send(`Conversation with ${receiverInfo.userName} created`)
        } else {
            const text = conversationExists[0].status == 'pending' ? `Already request sent. It is in ${conversationExists[0].status} status` : `Already conversation exists with this user`
            return res.status(200).send(text)
        }

    }
    catch (error) {
        console.log(error);
        return res.status(400).send(error)
    }
}

exports.updateMessageRequest = async (req, res, next) => {
    try {
        const conversationExists = await Conversation.findOne({
            _id: req.body.conversationId
        })
        if (conversationExists) {
            const receiverExist = await User.findOne({ _id: conversationExists.members[1] })
            const senderExist = await User.findOne({ _id: conversationExists.members[0] })
            if (req.body.status == 'rejected') {
                await Conversation.deleteOne({ _id: req.body.conversationId })
                await send_Notification_mail(senderExist.email, `Message Update from ${receiverExist.userName}`, `${receiverExist.userName} has ${req.body.status} your message request and added reason: "${req.body.rejectReason}"`, senderExist.userName)
                await send_Notification_mail(receiverExist.email, `Message Update`, `You have ${req.body.status} the message request sent by ${senderExist.userName}"`, receiverExist.userName)
                await Notification.create({ senderInfo: receiverExist._id, receiver: senderExist._id, message: `${receiverExist.userName} has ${req.body.status} your message request and added reason: "${req.body.rejectReason}"`, type: 'pitch', read: false })
                return res.status(200).send(`Message ${req.body.status}`)
            }
            // After approve pitch will associate with this conversation
            const selectedPitch = await Pitch.findOne({ _id: conversationExists.pitchId })
            if (selectedPitch) {
                selectedPitch.associatedTo.push(receiverExist._id)
                selectedPitch.save()
            }
            await Conversation.updateOne({ _id: req.body.conversationId }, { $set: { status: req.body.status } })
            await send_Notification_mail(senderExist.email, `Message Update from ${receiverExist.userName}`, `${receiverExist.userName} has ${req.body.status} your message request and added reason: "${req.body.rejectReason}"`, senderExist.userName)
            await send_Notification_mail(receiverExist.email, `Message Update`, `You have ${req.body.status} the message request sent by ${senderExist.userName}"`, receiverExist.userName)
            await Notification.create({ senderInfo: receiverExist._id, receiver: senderExist._id, message: `${receiverExist.userName} has ${req.body.status} your message request and added reason: "${req.body.rejectReason}"`, type: 'pitch', read: false })
            return res.status(200).send(`Message ${req.body.status}`)
        }
        return res.status(400).send('Conversation not found')

    }
    catch (error) {
        console.log(error)
        return res.status(400).send(error)
    }
}

exports.fetchRequest = async (req, res, next) => {
    try {
        const conversationExists = await Conversation.find({
            requestedTo: req.body.userId, status: 'pending'
        }).populate({ path: 'members', select: ['userName', 'image', 'role'] })
        return res.status(200).send(conversationExists)

    }
    catch (error) {
        return res.status(400).send(error)
    }
}

exports.findUserConversation = async (req, res, next) => {
    try {
        const conversationExists = await Conversation.find({
            'members': { $in: [req.body.userId] }
        })
            .populate({ path: 'members', select: ['userName', 'image', 'role'] })
        // .populate('members')
        if (conversationExists) {
            return res.status(200).json(conversationExists)
        }
        return res.status(400).send('No Conversation found')

    }
    catch (error) {
        return res.status(400).send(error)
    }
}

exports.findConversationById = async (req, res, next) => {
    try {
        const conversationExists = await Conversation.findOne({
            _id: req.body.conversationId
        })
            .populate({ path: 'members', select: ['userName', 'image', 'role'] })
        // .populate('members')
        if (conversationExists) {
            return res.status(200).json(conversationExists)
        }
        return res.status(400).send('No Conversation found')

    }
    catch (error) {
        return res.status(400).send(error)
    }
}

exports.deleteUserConversation = async (req, res, next) => {
    try {
        const { conversationId } = req.body;
        await Conversation.deleteOne({ _id: conversationId })
        await Message.deleteMany({ conversationId: conversationId })
        return res.status(200).json('Conversation deleted successfully')

    }
    catch (error) {
        return res.status(400).send(error)
    }
}


exports.addMessage = async (req, res, next) => {
    try {
        const { file, email, conversationId, senderId, receiverId, message, userId } = req.body
        if (file !== '') {
            const result = await cloudinary.uploader.upload(file, {
                folder: `${email}/chat`
            })
            await Message.create({ email, file: { public_id: result.public_id, secure_url: result.secure_url }, conversationId, senderId, receiverId, message })
            await Conversation.updateOne({ _id: conversationId }, { $set: { seen: '', lastMessageTo: receiverId, lastMessageText: message } })
            return res.status(200).send('New Message is added')
        }
        await Message.create({ email, file: '', conversationId, senderId, receiverId, message })
        await Conversation.updateOne({ _id: conversationId }, { $set: { seen: '', lastMessageTo: receiverId, lastMessageText: message } })

        return res.status(200).send('New Message is added')

    }
    catch (error) {
        return res.status(400).send(error)
    }
}


exports.changeSeenStatus = async (req, res, next) => {
    try {
        const { senderId, receiverId, conversationId } = req.body;
        const MessageExists = await Message.find({ senderId: senderId, receiverId: receiverId }).sort({ _id: -1 }).limit(1)
        // console.log(MessageExists);
        // console.log(MessageExists[0].seen);
        if (MessageExists[0] && MessageExists[0].seen == undefined) {
            await Message.updateOne({ _id: MessageExists[0]._id }, { $set: { seen: new Date() } })
            await Conversation.updateOne({ _id: MessageExists[0].conversationId }, { $set: { seen: 'seen' } })

            return res.status(200).send('Message is seen')
        }
        // if (MessageExists[0]) {
        //     await Conversation.updateOne({ _id: MessageExists[0].conversationId }, { $set: { seen: 'seen' } })

        //     return res.status(200).send('Message Already seen')
        // } else {
        //     await Conversation.updateOne({ _id: conversationId }, { $set: { seen: '' } })

        //     return res.status(200).send('New chat seen')
        // }



    }
    catch (error) {
        console.log(error);
        return res.status(400).send(error)
    }
}



exports.deleteMessage = async (req, res, next) => {
    try {
        const { messageId } = req.body
        await Message.deleteOne({ _id: messageId })
        return res.status(200).send('Message Deleted Successfully')
    }
    catch (error) {
        return res.status(400).send(error)
    }
}


exports.getMessage = async (req, res, next) => {
    try {
        const { conversationId } = req.body
        const result = await Message.find({ conversationId: conversationId })
        return res.status(200).send(result)
    }
    catch (error) {
        return res.status(400).send(error)
    }
}


exports.getTotalMessageCount = async (req, res, next) => {
    try {
        const { receiverId, checkingUser } = req.body
        const result = await Conversation.find({ 'members': { $in: [receiverId] }, status: 'approved', seen: '', lastMessageTo: checkingUser })
        return res.status(200).send(result)
    }
    catch (error) {
        console.log(error);
        return res.status(400).send(error)
    }
}







exports.getFrienddetailsByConversationId = async (req, res, next) => {
    try {
        const { conversationId, userId } = req.body
        const result = await Conversation.findOne({ _id: conversationId }).populate({ path: 'members', select: ['email','userName', 'image', 'role'] })
        return res.status(200).send(result)
    }
    catch (error) {
        console.log(error)
        return res.status(400).send(error)
    }
}




exports.chatBlock = async (req, res, next) => {
    try {
        const { conversationId, blockedBy } = req.body
        const user = await User.findOne({ _id: blockedBy })
        const conversation = await Conversation.findOne({ _id: conversationId, 'chatBlocked.blockedBy': blockedBy })
        if (conversation) {
            await Conversation.updateOne({ _id: conversationId }, { $set: { 'chatBlocked': {} } })
            return res.status(200).send('Chat Unblocked')
        }
        await Conversation.updateOne({ _id: conversationId }, { $set: { 'chatBlocked': { userInfo: user._id, blockedBy: blockedBy } } })
        return res.status(200).send('Chat blocked')

    } catch (err) {
        return res.status(400).send(err)
    }
}

