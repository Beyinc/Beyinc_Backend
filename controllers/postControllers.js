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
dotenv.config({ path: "../config.env" });
const twilio = require("twilio");
const UserUpdate = require("../models/UpdateApproval");
const cloudinary = require("../helpers/UploadImage");
const Notification = require("../models/NotificationModel");
const send_Notification_mail = require("../helpers/EmailSending");
const jobTitles = require("../models/Roles");
const Posts = require("../models/Posts");

exports.getPost = async (req, res, next) => {
    try {
        const { id } = req.body;
        const PostExist = await Posts.findOne(
            { _id: id, reported: false }
        ).populate({
            path: "createdBy",
            select: ["userName", "image", "role", '_id'],
        }).populate({
            path: "likes",
            select: ["userName", "image", "role", '_id'],
        }).populate({
            path: "disLikes",
            select: ["userName", "image", "role", '_id'],
        });

        if (PostExist) {
            return res.status(200).json(PostExist);
        }
    } catch (error) {
        console.log(error);
    }
};


exports.createPost = async (req, res, next) => {
    try {
        const { description, image, type, tags, createdBy, pitchId } = req.body
        const result = await cloudinary.uploader.upload(image, {
            folder: `${createdBy.email}/posts`,
        });
        const createdPost = await Posts.create({ description, image: result, type, tags: tags?.map(m => m._id), createdBy: createdBy._id, pitchId, openDiscussion: (pitchId !== null && pitchId!==undefined)? true: false })
        if (tags.length > 0) {
            for (let i = 0; i < tags.length; i++){
                await send_Notification_mail(tags[i].email, `You got a post tag!`, `${createdBy.userName} tagged you in their post. check the notification in app.`, tags[i].userName)
                await Notification.create({ senderInfo: createdBy._id, receiver: tags[i]._id, message: `${createdBy.userName} tagged you in their post. check the notification in app.`, type: 'pitch', read: false })
            }
        }
        const PostExist = await Posts.findOne(
            { _id: createdPost._id}
        ).populate({
            path: "createdBy",
            select: ["userName", "image", "role", '_id'],
        }).populate({
            path: "likes",
            select: ["userName", "image", "role", '_id'],
        }).populate({
            path: "disLikes",
            select: ["userName", "image", "role", '_id'],
        });

        return res.status(200).json(PostExist)
    } catch (error) {
        console.log(error);
    }
};



exports.editPost = async (req, res, next) => {
    try {
        const { description, image, type, tags, createdBy, pitchId, id } = req.body
        
        const updatedPost = await Posts.updateOne({ _id: id }, { $set: { description, image, type, tags, createdBy, pitchId } })
        const PostExist = await Posts.findOne(
            { _id: updatedPost._id }
        ).populate({
            path: "createdBy",
            select: ["userName", "image", "role", '_id'],
        }).populate({
            path: "likes",
            select: ["userName", "image", "role", '_id'],
        }).populate({
            path: "disLikes",
            select: ["userName", "image", "role", '_id'],
        });

        return res.status(200).json(PostExist)
    } catch (error) {
        console.log(error);
    }
};




exports.reportPost = async (req, res, next) => {
    try {
        const { id, reportBy, reason } = req.body
        const PostExist = await Posts.findOne(
            { _id: id, reported: false }
        ).populate({
            path: "createdBy",
            select: ["userName", 'email', "image", "role", '_id'],
        }).populate({
            path: "likes",
            select: ["userName", "image", "role", '_id'],
        }).populate({
            path: "disLikes",
            select: ["userName", "image", "role", '_id'],
        });
        await Posts.updateOne({ _id: id }, { $set: { reportBy, reportedTime: new Date(), reported: true,reportReason: reason } })
        await send_Notification_mail(PostExist.createdBy.email, `Report created to your post!`, `Report created to the post ${PostExist._id} admin will verify it."`, PostExist.createdBy.userName)


        return res.status(200).json('Reported Successfully')
    } catch (error) {
        console.log(error);
    }
};


exports.updatereportPost = async (req, res, next) => {
    try {
        const { id } = req.body

        await Posts.updateOne({ _id: id }, { $set: { reportBy: '', reportedTime: '', reported: false, reportReason: '' } })


        return res.status(200).json('Report removed')
    } catch (error) {
        console.log(error);
    }
};


exports.likePost = async (req, res, next) => {
    try {
        const post = await Posts.findById(req.body.id);

        if (post.likes?.includes(req.payload.user_id)) {
            post.likes = post.likes.filter((v) => v != req.payload.user_id);
        } else {
            post.likes.push(req.payload.user_id);
        }
        if (post.Dislikes?.includes(req.payload.user_id)) {
            post.Dislikes = post.Dislikes.filter((v) => v != req.payload.user_id);
        }
        post.save();
        return res.status(200).json("post liked");
    } catch (err) {
        console.log(err);
        return res.status(400).json(err);
    }
};


exports.DisLikePost = async (req, res, next) => {
    try {
        const post = await Posts.findById(req.body.id);

        if (post.Dislikes?.includes(req.payload.user_id)) {
            post.Dislikes = post.Dislikes.filter((v) => v != req.payload.user_id);
        } else {
            post.Dislikes.push(req.payload.user_id);
        }

        if (post.likes?.includes(req.payload.user_id)) {
            post.likes = post.likes.filter((v) => v != req.payload.user_id);
        }
        post.save();
        return res.status(200).json("post Disliked");
    } catch (err) {
        console.log(err);
        return res.status(400).json(err);
    }
};


exports.deletePost = async (req, res, next) => {
    try {
        const { id } = req.body;
        await Posts.deleteOne(
            { _id: id }
        )
        return res.status(200).json('Post deleted');

    } catch (error) {
        console.log(error);
    }
};
