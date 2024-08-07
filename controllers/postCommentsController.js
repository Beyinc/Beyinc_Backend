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
const PostComment = require("../models/PostCommentModel");

exports.addPostComment = async (req, res, next) => {
    try {
        const { postId, comment, commentBy, parentCommentId } = req.body
        const newComment = await PostComment.create({ comment: comment, commentBy: commentBy, postId: postId, parentCommentId: parentCommentId })
        if (parentCommentId !== undefined) {
            await PostComment.updateOne({ _id: parentCommentId }, { $push: { subComments: newComment._id } })
        }
        await newComment.save()
        return res.status(200).json("Comment Added");
    } catch (err) {
        return res.status(400).json(err);
    }
};


exports.getPostComment = async (req, res, next) => {
    try {
        const { postId } = req.body

        const comments = await PostComment.find({ postId: postId }).populate({
            path: "commentBy",
            select: ["email", "userName", "image", "role"],
        }).populate({
            path: "subComments",
            populate: {
                path: "commentBy",
                select: ["email", "userName", "image", "role"],
            },
        });
        return res.status(200).json(comments);
    } catch (err) {
        return res.status(400).json(err);
    }
};



exports.likePostComment = async (req, res, next) => {
    try {
        const comment = await PostComment.findById(req.body.comment_id);
        if (comment?.likes?.includes(req.payload.user_id)) {
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


exports.DislikePostComment = async (req, res, next) => {
    try {
        const comment = await PostComment.findById(req.body.comment_id);

        if (comment?.Dislikes?.includes(req.payload.user_id)) {
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