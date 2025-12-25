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
const PostComment = require("../models/PostCommentModel");
const { ComplianceRegistrationInquiriesListInstance } = require("twilio/lib/rest/trusthub/v1/complianceRegistrationInquiries");
const { REACTION_TYPES } = require("../constants/postReactins");

// To add user reaction and  reaction counts to post data
const formatPost = (post, userId) => {
    if (!post) return null;

    let postObj;
    if (post.toObject && typeof post.toObject === "function") {
        postObj = post.toObject(); 
    } else if (post._doc) {
        postObj = post._doc; 
    } else {
        postObj = post;
    }

    let userReaction = null;
    if (postObj.reactions && Array.isArray(postObj.reactions)) {
        const reaction = postObj.reactions.find((r) => {
            const reactionUserId = r.user?._id || r.user;
            return reactionUserId?.toString() === userId?.toString();
        });
        userReaction = reaction?.type || null;
    }

    return {
        ...postObj,
        userReaction,
    };
};


exports.getPost = async (req, res, next) => {
  try {
    const { id } = req.body;
    const userId = req.payload.user_id;

    const PostExist = await Posts.findOne({ _id: id })
      .populate({
        path: "createdBy",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "tags",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "pitchId",
        select: ["title", "_id"],
      })
      // .populate({
      //   path: "likes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      // .populate({
      //   path: "disLikes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      .populate({ path: "reactions.user", select: ["userName", "image", "role", "_id"] })
      .populate({
        path: "openDiscussionTeam",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "openDiscussionRequests",
        select: ["userName", "image", "role", "_id"],
      });

    if (PostExist) {
      const modifiedPostData = await formatPost(PostExist, userId);

      return res.status(200).json(modifiedPostData);
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getAllPosts = async (req, res, next) => {
  try {
    // const { page, pageSize } = req.body;
    // const skip = page;
    // const limit = pageSize - page;
    // console.log("page1-",page)
    // console.log("page-",pageSize);
    // console.log("posts size-",limit);

    const userId = req.payload.user_id;
    // console.log("userId-",userId);
      
    const { page = 1, pageSize = 10 } = req.body;
    const skip = (page - 1) * pageSize;
    const limit = pageSize;
      
    // console.log("skip-",skip);
    // console.log("limit-",limit);
    const data = await Posts.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "createdBy",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "tags",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "pitchId",
        select: ["title", "_id"],
      })
      // .populate({
      //   path: "likes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      // .populate({
      //   path: "disLikes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      .populate({ path: "reactions.user", select: ["userName", "image", "role", "_id"] })
      .populate({
        path: "openDiscussionTeam",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "openDiscussionRequests",
        select: ["userName", "image", "role", "_id"],
      })
      .lean()

      const modifiedData = data.map(post =>{
        formatPost(post, userId)
        // console.log(formatPost(post, userId));
      })
      // console.log("look her3")
      // console.log(modifiedData)

      return res.status(200).json(modifiedData);
    } catch (error) {
      console.log(error);
  }
};

exports.getTopTrendingPosts = async (req, res, next) => {
  try {
    const data = await Posts.aggregate([
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          dislikesCount: { $size: { $ifNull: ["$disLikes", []] } },
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ["$likesCount", 2] },
              { $multiply: ["$dislikesCount", -1] },
            ],
          },
        },
      },
      {
        $sort: { score: -1 },
      },
      {
        $limit: 2,
      },
    ]);

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", error });
  }
};

exports.getPostRequestDiscussion = async (req, res, next) => {
  try {
    const { user_id } = req.body;
    const PostExist = await Posts.find({
      createdBy: user_id,
      openDiscussion: false,
      $expr: { $gt: [{ $size: "$openDiscussionRequests" }, 0] },
    }).populate({
      path: "openDiscussionRequests",
      select: ["userName", "image", "role", "_id"],
    });

    if (PostExist) {
      return res.status(200).json(PostExist);
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getUsersPost = async (req, res, next) => {
  try {
    const { user_id } = req.body;
    const PostExist = await Posts.find({ createdBy: user_id })
      .populate({
        path: "createdBy",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "tags",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "pitchId",
        select: ["title", "_id"],
      })
      // .populate({
      //   path: "likes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      // .populate({
      //   path: "disLikes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      .populate({ path: "reactions.user", select: ["userName", "image", "role", "_id"] })
      .populate({
        path: "openDiscussionTeam",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "openDiscussionRequests",
        select: ["userName", "image", "role", "_id"],
      })
      .sort({ updatedAt: -1 });

    if (PostExist) {
      return res.status(200).json(PostExist);
    }
  } catch (error) {
    console.log(error);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const {
      description,
      image,
      type,
      tags,
      createdBy,
      pitchId,
      openDiscussion,
      link,
      fullDetails,
      groupDiscussion,
      postTitle,
      visibility,
    } = req.body;

    // Only upload the image if it's provided
    let uploadedImage = null;
    if (image) {
      uploadedImage = await cloudinary.uploader.upload(image, {
        folder: `${createdBy.email}/posts`,
      });
    }

    const createdPost = await Posts.create({
      reported: false,
      description,
      postTitle,
      type,
      visibility,
      createdBy: createdBy._id,
      ...(tags?.length && { tags: tags.map((m) => m._id) }), // Conditional tags
      ...(pitchId && { pitchId }), // Conditional pitchId
      ...(openDiscussion !== undefined && { openDiscussion }), // Conditional openDiscussion
      ...(link && { link }), // Conditional link
      ...(fullDetails && { fullDetails }), // Conditional fullDetails
      ...(groupDiscussion && { groupDiscussion }), // Conditional groupDiscussion
      ...(uploadedImage && { image: uploadedImage }), // Conditional image
    });
    if (tags.length > 0) {
      for (let i = 0; i < tags.length; i++) {
        await send_Notification_mail(
          tags[i].email,
          `You got a post tag!`,
          `${createdBy.userName} tagged you in their post. check the notification in app.`,
          tags[i].userName,
          `/posts/${createdPost._id}`
        );
        await Notification.create({
          senderInfo: createdBy._id,
          receiver: tags[i]._id,
          message: `${createdBy.userName} tagged you in their post. check the notification in app.`,
          type: "postDiscussion",
          postId: createdPost._id,
          read: false,
        });
      }
    }
    const PostExist = await Posts.findOne({ _id: createdPost._id })
      .populate({
        path: "createdBy",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "tags",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "pitchId",
        select: ["title", "_id"],
      })
      // .populate({
      //   path: "likes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      // .populate({
      //   path: "disLikes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      .populate({ path: "reactions.user", select: ["userName", "image", "role", "_id"] })
      .populate({
        path: "openDiscussionTeam",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "openDiscussionRequests",
        select: ["userName", "image", "role", "_id"],
      });

    return res.status(200).json(PostExist);
  } catch (error) {
    console.log(error);
  }
};

exports.editPost = async (req, res, next) => {
  try {
    const {
      description,
      image,
      type,
      tags,
      createdBy,
      pitchId,
      id,
      link,
      fullDetails,
      groupDiscussion,
      postTitle,
    } = req.body;

    const PostDoesExist = await Posts.findOne({ _id: id });
    let result = "";
    if (image && !image.public_id) {
      if (PostDoesExist?.image.public_id !== undefined) {
        await cloudinary.uploader.destroy(
          PostDoesExist?.image.public_id,
          (error, result) => {
            if (error) {
              console.error("Error deleting image:", error);
            } else {
              console.log("Image deleted successfully:", result);
            }
          }
        );
      }
      result = await cloudinary.uploader.upload(image, {
        folder: `${createdBy.email}/posts`,
      });
    } else {
      result = image;
    }
    await Posts.updateOne(
      { _id: id },
      {
        $set: {
          description,
          link,
          fullDetails,
          groupDiscussion,
          postTitle,
          image: result,
          type,
          tags: tags?.map((m) => m._id),
          createdBy: createdBy._id,
          pitchId,
          openDiscussion:
            pitchId !== null && pitchId !== undefined ? false : true,
        },
      }
    );
    const PostExist = await Posts.findOne({ _id: id })
      .populate({
        path: "createdBy",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "tags",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "pitchId",
        select: ["title", "_id"],
      })
      // .populate({
      //   path: "likes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      // .populate({
      //   path: "disLikes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      .populate({ path: "reactions.user", select: ["userName", "image", "role", "_id"] })
      .populate({
        path: "openDiscussionTeam",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "openDiscussionRequests",
        select: ["userName", "image", "role", "_id"],
      });

    return res.status(200).json(PostExist);
  } catch (error) {
    console.log(error);
  }
};

exports.reportPost = async (req, res, next) => {
  try {
    const { id, reportBy, reason,reportType} = req.body;
    const PostExist = await Posts.findOne({ _id: id })
      .populate({
        path: "createdBy",
        select: ["userName", "email", "image", "role", "_id"],
      })
      .populate({
        path: "tags",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "pitchId",
        select: ["title", "_id"],
      })
      // .populate({
      //   path: "likes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      // .populate({
      //   path: "disLikes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      .populate({ path: "reactions.user", select: ["userName", "image", "role", "_id"] })
      .populate({
        path: "openDiscussionTeam",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "openDiscussionRequests",
        select: ["userName", "image", "role", "_id"],
      });
    // Update the 'reported' field to true
    await Posts.updateOne({ _id: id }, { $set: { reported: true } });

    // Push a new report into the 'reportBy' array
    await Posts.updateOne(
      { _id: id },
      {
        $push: {
          reportBy: {
            user: reportBy,
            reportedTime: new Date(),
            reason: reason,
            reportType:reportType
          },
        },
      }
    );
    await send_Notification_mail(
      PostExist.createdBy.email,
      `Report created to your post!`,
      `Report created to the post ${PostExist._id} admin will verify it.`,
      PostExist.createdBy.userName,
      `/posts/${id}`
    );
    await Notification.create({
      senderInfo: reportBy,
      receiver: PostExist.createdBy._id,
      message: `Report created to the post. Admin will verify it`,
      type: "report",
      postId: id,
      read: false,
    });

    return res.status(200).json("Reported Successfully");
  } catch (error) {
    console.log(error);
  }
};

exports.getReportedPosts = async (req, res, next) => {
  try {
    const reportedposts = await Posts.find({
      reported: true,
      $expr: { $gt: [{ $size: "$reportBy" }, 1] },
    })
      .populate({
        path: "createdBy",
        select: ["userName", "email", "image", "role", "_id"],
      })
      .populate({
        path: "tags",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "pitchId",
        select: ["title", "_id"],
      })
      // .populate({
      //   path: "likes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      // .populate({
      //   path: "disLikes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      .populate({ path: "reactions.user", select: ["userName", "image", "role", "_id"] })
      .populate({
        path: "openDiscussionTeam",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "openDiscussionRequests",
        select: ["userName", "image", "role", "_id"],
      })
      .sort({ updatedAt: -1 });
    return res.status(200).json(reportedposts);
  } catch (error) {
    console.log(error);
  }
};

exports.updatereportPost = async (req, res, next) => {
  try {
    const { id, postDecide } = req.body;
    const result = await Posts.findOne({ _id: id }).populate({
      path: "createdBy",
      select: ["userName", "email", "image", "role", "_id"],
    });
    if (postDecide == "delete") {
      await cloudinary.uploader.destroy(
        result.image.public_id,
        (error, result) => {
          if (error) {
            console.error("Error deleting image:", error);
          } else {
            console.log("Image deleted successfully:", result);
          }
        }
      );
      await send_Notification_mail(
        result.createdBy.email,
        `Post deleted by admin!`,
        `Your Post has been deleted by admin due to inappropriate content`,
        result.createdBy.userName,
        "/editProfile"
      );
      await PostComment.deleteMany({ postId: id });
      await Posts.deleteOne({ _id: id });

      return res.status(200).json("Post deleted");
    }
    await Posts.updateOne(
      { _id: id },
      { $set: { reportBy: [], reported: false } }
    );

    return res.status(200).json("Report removed");
  } catch (error) {
    console.log(error);
  }
};

exports.requestIntoOpenDiscussion = async (req, res, next) => {
  try {
    const { id, user_id } = req.body;

    const requestedUser = await User.findOne({ _id: user_id });

    const postExists = await Posts.findOne({ _id: id }).populate({
      path: "createdBy",
      select: ["userName", "email", "image", "role", "_id"],
    });
    postExists.openDiscussionRequests.push(user_id);
    await postExists.save();

    const PostExist = await Posts.findOne({ _id: id })
      .populate({
        path: "createdBy",
        select: ["userName", "email", "image", "role", "_id"],
      })
      .populate({
        path: "tags",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "pitchId",
        select: ["title", "_id"],
      })
      // .populate({
      //   path: "likes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      // .populate({
      //   path: "disLikes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      .populate({ path: "reactions.user", select: ["userName", "image", "role", "_id"] })
      .populate({
        path: "openDiscussionTeam",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "openDiscussionRequests",
        select: ["userName", "image", "role", "_id"],
      });
    await send_Notification_mail(
      postExists.createdBy.email,
      `Request for post discussion!`,
      `${requestedUser.userName} want to join in discussion for post ${postExists._id}`,
      postExists.createdBy.userName,
      `/posts/${postExists._id}`
    );
    await Notification.create({
      senderInfo: requestedUser._id,
      receiver: postExists.createdBy._id,
      message: `${requestedUser.userName} want to join in discussion. `,
      type: "postDiscussion",
      postId: postExists._id,
      read: false,
    });

    return res.status(200).json(PostExist);
  } catch (error) {
    console.log(error);
  }
};

exports.updaterequestIntoOpenDiscussion = async (req, res, next) => {
  try {
    const { id, user_id, type } = req.body;
    const requestedUser = await User.findOne({ _id: user_id });
    const postExists = await Posts.findOne({ _id: id }).populate({
      path: "createdBy",
      select: ["userName", "email", "image", "role", "_id"],
    });
    if (type == "add") {
      postExists.openDiscussionTeam.push(user_id);
      await send_Notification_mail(
        requestedUser.email,
        `Adding into the post discussion!`,
        `${postExists.createdBy.userName} approved your request for post discussion. check the notification in app.`,
        requestedUser.userName,
        `/posts/${postExists._id}`
      );
      await Notification.create({
        senderInfo: postExists.createdBy._id,
        receiver: requestedUser._id,
        message: `${postExists.createdBy.userName} approved your request for post discussion.`,
        type: "postDiscussion",
        postId: postExists._id,
        read: false,
      });
    }
    postExists.openDiscussionRequests.splice(
      postExists.openDiscussionRequests.indexOf(user_id),
      1
    );
    await postExists.save();
    const PostExist = await Posts.findOne({ _id: id })
      .populate({
        path: "createdBy",
        select: ["userName", "email", "image", "role", "_id"],
      })
      .populate({
        path: "tags",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "pitchId",
        select: ["title", "_id"],
      })
      // .populate({
      //   path: "likes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      // .populate({
      //   path: "disLikes",
      //   select: ["userName", "image", "role", "_id"],
      // })
      .populate({ path: "reactions.user", select: ["userName", "image", "role", "_id"] })
      .populate({
        path: "openDiscussionTeam",
        select: ["userName", "image", "role", "_id"],
      })
      .populate({
        path: "openDiscussionRequests",
        select: ["userName", "image", "role", "_id"],
      });
    return res.status(200).json(PostExist);
  } catch (error) {
    console.log(error);
  }
};

// exports.likePost = async (req, res, next) => {
//   try {
//     const post = await Posts.findById(req.body.id);

//     if (post.likes?.includes(req.payload.user_id)) {
//       post.likes = post.likes.filter((v) => v != req.payload.user_id);
//     } else {
//       post.likes.push(req.payload.user_id);
//     }
//     if (post.disLikes?.includes(req.payload.user_id)) {
//       post.disLikes = post.disLikes.filter((v) => v != req.payload.user_id);
//     }
//     await post.save();
//     const PostExist = await Posts.findOne({ _id: req.body.id })
//       .populate({
//         path: "createdBy",
//         select: ["userName", "image", "role", "_id"],
//       })
//       .populate({
//         path: "tags",
//         select: ["userName", "image", "role", "_id"],
//       })
//       .populate({
//         path: "pitchId",
//         select: ["title", "_id"],
//       })
//       // .populate({
//       //   path: "likes",
//       //   select: ["userName", "image", "role", "_id"],
//       // })
//       // .populate({
//       //   path: "disLikes",
//       //   select: ["userName", "image", "role", "_id"],
//       // })
//       .populate({
//         path: "openDiscussionTeam",
//         select: ["userName", "image", "role", "_id"],
//       })
//       .populate({
//         path: "openDiscussionRequests",
//         select: ["userName", "image", "role", "_id"],
//       });

//     return res.status(200).json(PostExist);
//   } catch (err) {
//     console.log(err);
//     return res.status(400).json(err);
//   }
// };

// exports.DisLikePost = async (req, res, next) => {
//   try {
//     const post = await Posts.findById(req.body.id);

//     if (post.disLikes?.includes(req.payload.user_id)) {
//       post.disLikes = post.disLikes.filter((v) => v != req.payload.user_id);
//     } else {
//       post.disLikes.push(req.payload.user_id);
//     }

//     if (post.likes?.includes(req.payload.user_id)) {
//       post.likes = post.likes.filter((v) => v != req.payload.user_id);
//     }
//     await post.save();
//     const PostExist = await Posts.findOne({ _id: req.body.id })
//       .populate({
//         path: "createdBy",
//         select: ["userName", "image", "role", "_id"],
//       })
//       .populate({
//         path: "tags",
//         select: ["userName", "image", "role", "_id"],
//       })
//       .populate({
//         path: "pitchId",
//         select: ["title", "_id"],
//       })
//       // .populate({
//       //   path: "likes",
//       //   select: ["userName", "image", "role", "_id"],
//       // })
//       // .populate({
//       //   path: "disLikes",
//       //   select: ["userName", "image", "role", "_id"],
//       // })
//       .populate({ path: "reactions.user", select: ["userName", "image", "role", "_id"] })
//       .populate({
//         path: "openDiscussionTeam",
//         select: ["userName", "image", "role", "_id"],
//       })
//       .populate({
//         path: "openDiscussionRequests",
//         select: ["userName", "image", "role", "_id"],
//       });

//     return res.status(200).json(PostExist);
//   } catch (err) {
//     console.log(err);
//     return res.status(400).json(err);
//   }
// };

exports.deletePost = async (req, res, next) => {
  try {
    const { id } = req.body;
    const result = await Posts.findOne({ _id: id });
    if(result.image.public_id){

      await cloudinary.uploader.destroy(
        result.image.public_id,
        (error, result) => {
          if (error) {
            console.error("Error deleting image:", error);
          } else {
            console.log("Image deleted successfully:", result);
          }
        }
      );
    }
    await PostComment.deleteMany({ postId: id });
    await Posts.deleteOne({ _id: id });
    
    return res.status(200).json("Post deleted");
  } catch (error) {
    console.log('error deleting post:', error);
    return res.status(500).json({ message: "Server error while deleting post." });
  }
};

// filterposts
// exports.filterposts = async (req, res, next) => {

//   try {
//     // const { people, sortOption, tags, selectedPostType } = req.body; // Extract people, sortOption, and tags from the request body
//     const { people, sortOption, tags, public: isPublic, private: isPrivate } = req.body; // Extract people, sortOption, and tags from the request body

//     // Create the filter object
//     const filter = {};

//     // Search for posts by people (username) if 'people' is provided
//     if (people) {
//       const users = await User.find({ userName: { $regex: people, $options: 'i' } }).select('_id');

//       // const users = await User.find({
//       //   userName: { $regex: people, $options: "i" },
//       // }).select("_id");
//       const userIds = users.map((user) => user._id);
//       filter.createdBy = { $in: userIds };
//     }

//     // Search for posts by tags (in 'type') if 'tags' is provided
//     if (tags && tags.length > 0) {
//       filter.type = { $in: tags }; // Match 'type' with any value from the 'tags' array
//     }

//     // Add filter for posts created within the last 1 day if sortOption is 'recent'
//     if (sortOption === "recent") {
//       const oneDayAgo = new Date();
//       oneDayAgo.setDate(oneDayAgo.getDate() - 1);
//       filter.createdAt = { $gte: oneDayAgo };
//     }

//     if (isPublic) {
//       filter.visibility = "public";
//     }
//     if (isPrivate) {
//       filter.visibility = "private";

//     }

//     // Fetch posts that match the filter
//     const filteredPosts = await Posts.find(filter)
//       .populate({
//         path: "createdBy",
//         select: ["userName", "image", "role", "_id"],
//       })
//       .populate({
//         path: "tags",
//         select: ["userName", "image", "role", "_id"],
//       })
//       .populate({
//         path: "pitchId",
//         select: ["title", "_id"],
//       })
//       .populate({
//         path: "likes",
//         select: ["userName", "image", "role", "_id"],
//       })
//       .populate({
//         path: "disLikes",
//         select: ["userName", "image", "role", "_id"],
//       })
//       .populate({
//         path: "openDiscussionTeam",
//         select: ["userName", "image", "role", "_id"],
//       })
//       .populate({
//         path: "openDiscussionRequests",
//         select: ["userName", "image", "role", "_id"],
//       });

//     // Return the filtered posts
//     return res.status(200).json(filteredPosts);
//   } catch (error) {
//     console.error("Error filtering posts:", error);
//     return res.status(500).json({ message: "Server error." });
//   }
// };


// Backend: filterposts
exports.filterposts = async (req, res, next) => {
  try {
    const {
      people,
      sortOption,
      tags,
      public: isPublic,
      private: isPrivate,
      page = 1,
      pageSize = 10,
    } = req.body; // added page & pageSize

    const userId = req.payload.user_id;

    const filter = {};

    if (people) {
      const users = await User.find({ userName: { $regex: people, $options: "i" } }).select("_id");
      const userIds = users.map((user) => user._id);
      filter.createdBy = { $in: userIds };
    }

    if (tags && tags.length > 0) {
      filter.type = { $in: tags };
    }

    if (sortOption === "recent") {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      filter.createdAt = { $gte: oneDayAgo };
    }

    if (isPublic) filter.visibility = "public";
    if (isPrivate) filter.visibility = "private";

    const filteredPosts = await Posts.find(filter)
      .populate({ path: "createdBy", select: ["userName", "image", "role", "_id"] })
      .populate({ path: "tags", select: ["userName", "image", "role", "_id"] })
      .populate({ path: "pitchId", select: ["title", "_id"] })
      // .populate({ path: "likes", select: ["userName", "image", "role", "_id"] })
      // .populate({ path: "disLikes", select: ["userName", "image", "role", "_id"] })
      .populate({ path: "reactions.user", select: ["userName", "image", "role", "_id"] })
      .populate({ path: "openDiscussionTeam", select: ["userName", "image", "role", "_id"] })
      .populate({ path: "openDiscussionRequests", select: ["userName", "image", "role", "_id"] })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();
      
      const modifiedData = await Promise.all(
        filteredPosts.map(post => formatPost(post, userId))
      )

    return res.status(200).json(modifiedData);
  } catch (error) {
    console.error("Error filtering posts:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

exports.reactToPost = async (req, res) => {
    try {
        const { postId, reactionType } = req.body;
        const userId = req.payload.user_id;

        const post = await Posts.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found." });
        }

        // if (post.createdBy.toString() === userId.toString()) {
        //     return res.status(403).json({
        //         message: "You cannot react to your own post.",
        //     });
        // }

        // Find existing reaction index
        const existingIndex = post.reactions.findIndex(
            (r) => r.user.toString() === userId.toString()
        );

        let userReaction = null;

        if (existingIndex === -1) {
            // Add new reaction
            post.reactions.push({
                user: userId,
                type: reactionType,
                createdAt: new Date(),
            });
            userReaction = reactionType;
        } else if (post.reactions[existingIndex].type === reactionType) {
            // Toggle off - remove reaction
            post.reactions.splice(existingIndex, 1);
            userReaction = null;
        } else {
            // Change reaction type
            post.reactions[existingIndex].type = reactionType;
            post.reactions[existingIndex].createdAt = new Date();
            userReaction = reactionType;
        }

        const newPostData = await post.save();

        return res.status(200).json({
            success: true,
            postId,
            userReaction,
            reactions: newPostData.reactions
        });
    } catch (error) {
        console.error("Error in reactToPost:", error);
        return res.status(500).json({
            message: "Something went wrong while reacting to the post.",
            error: error.message,
        });
    }
};