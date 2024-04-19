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
const Notification = require("../models/NotificationModel");
const send_Notification_mail = require("../helpers/EmailSending");
const UserComment = require("../models/UserCommentModel");

exports.addUserComment = async (req, res, next) => {
    try {
        const { userId, comment, commentBy } = req.body
        await UserComment.create({ comment: comment, commentBy: commentBy, userId: userId })
        return res.status(200).json("Comment Added");
    } catch (err) {
        return res.status(400).json(err);
    }
};


exports.getUserComment = async (req, res, next) => {
    try {
        const { userId } = req.body
        const comments = await UserComment.find({ userId: userId }).populate({
            path: "commentBy",
            select: ["userName", "image", "role"],
        }).populate({ path: 'likes', select: ["userName", "image", "role"] }).populate({ path: 'Dislikes', select: ["userName", "image", "role"] });
        return res.status(200).json(comments);
    } catch (err) {
        return res.status(400).json(err);
    }
};



exports.likeComment = async (req, res, next) => {
    try {
        const comment = await UserComment.findById(req.body.comment_id);

        if (comment.likes?.includes(req.payload.user_id)) {
            comment.likes = comment.likes.filter((v) => v != req.payload.user_id);
        } else {
            comment.likes.push(req.payload.user_id);
        }
        if (comment.Dislikes?.includes(req.payload.user_id)) {
            comment.Dislikes = comment.Dislikes.filter((v) => v != req.payload.user_id);
        }
        await comment.save();
        return res.status(200).json("comment liked");
    } catch (err) {
        console.log(err);
        return res.status(400).json(err);
    }
};


exports.DislikelikeComment = async (req, res, next) => {
    try {
        const comment = await UserComment.findById(req.body.comment_id);
  
        if (comment.Dislikes?.includes(req.payload.user_id)) {
            comment.Dislikes = comment.Dislikes.filter((v) => v != req.payload.user_id);
        } else {
            comment.Dislikes.push(req.payload.user_id);
        }

        if (comment.likes?.includes(req.payload.user_id)) {
            comment.likes = comment.likes.filter((v) => v != req.payload.user_id);
        }
        await comment.save();
        return res.status(200).json("comment Disliked");
    } catch (err) {
        console.log(err);
        return res.status(400).json(err);
    }
};