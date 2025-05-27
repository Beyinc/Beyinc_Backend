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
const fileUpload = require('express-fileupload');

exports.addPostComment = async (req, res, next) => {
    try {
        const { postId, comment, commentBy, parentCommentId } = req.body;
        let fileData = null;

        // Handle file upload if present
        if (req.files && req.files.file) {
            const file = req.files.file;
            
            // Validate file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                return res.status(400).json({ error: "File size should be less than 10MB" });
            }
            
            // Determine file type
            let fileType = '';
            if (file.mimetype.startsWith('image/')) {
                fileType = 'image';
            } else if (file.mimetype.startsWith('video/')) {
                fileType = 'video';
            } else if (file.mimetype === 'application/pdf') {
                fileType = 'pdf';
            } else {
                return res.status(400).json({ error: "Invalid file type. Only images, videos, and PDFs are allowed." });
            }

            try {
                // Upload to cloudinary
                const result = await cloudinary.uploader.upload(file.tempFilePath, {
                    resource_type: fileType === 'video' ? 'video' : 'auto',
                    folder: 'comment_files'
                });

                fileData = {
                    public_id: result.public_id,
                    url: result.secure_url,
                    type: fileType
                };
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return res.status(500).json({ error: "Error uploading file to cloud storage" });
            }
        }

        const newComment = await PostComment.create({
            comment: comment,
            commentBy: commentBy,
            postId: postId,
            parentCommentId: parentCommentId,
            file: fileData
        });

        if (parentCommentId) {
            await PostComment.updateOne(
                { _id: parentCommentId },
                { $push: { subComments: newComment._id }}
            );
        }

        await newComment.save();
        return res.status(200).json("Comment Added");
    } catch (err) {
        console.error("Error in addPostComment:", err);
        return res.status(500).json({ error: "Internal server error" });
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