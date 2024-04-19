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

exports.getProfile = async (req, res, next) => {
  try {
    const { id } = req.body;
    const { user_id } = req.payload;
    const userDoesExist = await User.findOne(
      { _id: id ? id : user_id },
      { password: 0, chatBlockedBy: 0 }
    ).populate({
      path: "followers",
      select: ["userName", "image", "role", '_id'],
    }).populate({
      path: "following",
      select: ["userName", "image", "role", '_id'],
    }).populate("role_details");

    // console.log(removePass);
    if (userDoesExist) {
      return res.status(200).json(userDoesExist);
    }
  } catch (error) {
    console.log(error);
  }
};


exports.followerController = async (req, res, next) => {
  const { followerReqBy, followerReqTo } = req.body
  
  const requestBy = await User.findOne({ _id: followerReqBy })
  const requestTo = await User.findOne({ _id: followerReqTo })

  if (!requestTo.followers.includes(followerReqBy)) {
    requestTo.followers.push(followerReqBy)
    await requestTo.save()
    requestBy.following.push(followerReqTo)
    await requestBy.save()
    const userDoesExist = await User.findOne(
      { _id: requestTo._id},
      { password: 0, chatBlockedBy: 0 }
    ).populate({
      path: "followers",
      select: ["userName", "image", "role", '_id'],
    }).populate({
      path: "following",
      select: ["userName", "image", "role", '_id'],
    }).populate("role_details");
    await send_Notification_mail(requestTo.email, 'Follower added!', `${requestBy.userName} is following you`, requestTo.userName, `/user/${followerReqBy}`)
    await Notification.create({ senderInfo: requestBy._id, receiver: requestTo._id, message: `${requestBy.userName} is following you.`, type: 'followerRequest', read: false })

    return res.status(200).json(userDoesExist)
  } else {
    requestTo.followers.splice(requestTo.followers.indexOf(followerReqBy), 1)
    await requestTo.save()
    requestBy.following.splice(requestBy.following.indexOf(followerReqTo), 1)
    await requestBy.save()
    const userDoesExist = await User.findOne(
      { _id: requestTo._id },
      { password: 0, chatBlockedBy: 0 }
    ).populate({
      path: "followers",
      select: ["userName", "image", "role", '_id'],
    }).populate({
      path: "following",
      select: ["userName", "image", "role", '_id'],
    }).populate("role_details");
    return res.status(200).json(userDoesExist)
  }

}

exports.getApprovalRequestProfile = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const userDoesExist = await User.findOne(
      { _id: userId },
      { password: 0 }
    );

    if (userDoesExist) {
      return res.status(200).json(userDoesExist);
    } else {
      return res.status(400).json("No User Found for request");
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getIsProfileComplete = async (req, res, next) => {
  try {
    const { user_id } = req.payload;
    const user = await User.findById(user_id);
    return res.status(200).json({ isProfileComplete: user.isProfileComplete });
  } catch (error) {
    return res.status(400).send({ message: err });
    console.log(error);
  }
};

const uploadFileWithBuffer = async (buffer, user_id) => {
  return await cloudinary.uploader.upload(buffer, {
    folder: `${user_id}/documents`,
  });
};

exports.updateProfileWithoutVerification = async (req, res, next) => {
  try {
    const { user_id } = req.payload;
    const user = await User.findById(user_id);
    const fileKeys = ["profile", "banner"];
    const userKeys = [
      "role",
      "fee",
      "skills",
      "selectedDate",
      "selectedProfile",
      "selectedTime",
      "selectedOneToOne",
      "selectedBecomePlatform",
      "selectedDropdownPrimary",
      "selectedDropdownSecondary",
      "selectedTypes",
      "selectedDomains",
      "experienceDetails",
      "educationDetails",
    ];
    const { role, isDraft } = req.body;
    const roleModel = {};
    const step3Keys = Object.keys(
      req.body.step3Data ? req.body.step3Data : {}
    ).filter((v) => !["_id", "__v", "createdAt", "updatedAt"].includes(v));
    for (let i = 0; i < fileKeys.length; i++) {
      const key = fileKeys[i];
      if (key == "profile" && req.body.step3Data[key]) {
        const uploadedFIle = await uploadFileWithBuffer(
          req.body.step3Data[key].data,
          user_id
        );
        user.image = {
          url: uploadedFIle.url,
          public_id: uploadedFIle.public_id,
        };
        continue;
      }
      if (req.body.step3Data[key]) {
        const uploadedFIle = await uploadFileWithBuffer(
          req.body.step3Data[key].data,
          user_id
        );
        user[key] = {
          url: uploadedFIle.url,
          public_id: uploadedFIle.public_id,
        };
      }
    }

    for (let i = 0; i < step3Keys.length; i++) {
      const key = step3Keys[i];
      if (req.body.step3Data[key]) roleModel[key] = req.body.step3Data[key];
    }
    const roleDetailsModel = jobTitles[role];
    delete roleModel["profile"];
    delete roleModel["banner"];
    const roleModelRes = await roleDetailsModel.create(roleModel);
    user.role_type = roleDetailsModel.modelName;
    user.role_details = roleModelRes._id;

    for (let i = 0; i < userKeys.length; i++) {
      const key = userKeys[i];
      if (req.body[key]) user[key] = req.body[key];
    }
    if (!isDraft) user.isProfileComplete = true;
    await user.save();
    return res.send({ message: "Successfully updated" });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ message: err });
  }
};

exports.editProfile = async (req, res, next) => {
  try {
    const {
      userId,
      email,
      salutation,
      mentorCategories,
      userName,
      role,
      phone,
      documents,
      experienceDetails,
      educationdetails,
      fee,
      bio,
      state,
      town,
      country,
      skills,
      languagesKnown,
    } = req.body;

    // validating email and password

    const userDoesExist = await UserUpdate.findOne({ email: email });

    let resume = "";
    if (documents.resume !== "" && Object.keys(documents.resume).length !== 0) {
      if (documents.resume?.public_id == undefined) {
        if (userDoesExist?.documents.resume.public_id !== undefined) {
          await cloudinary.uploader.destroy(
            userDoesExist?.documents.resume.public_id,
            (error, result) => {
              if (error) {
                console.error("Error deleting image:", error);
              } else {
                console.log("Image deleted successfully:", result);
              }
            }
          );
        }
        resume = await cloudinary.uploader.upload(documents.resume, {
          folder: `${email}/documents`,
        });
      } else {
        resume = documents.resume;
      }
    } else {
      if (userDoesExist?.documents.resume.public_id !== undefined) {
        await cloudinary.uploader.destroy(
          userDoesExist?.documents.resume.public_id,
          (error, result) => {
            if (error) {
              console.error("Error deleting image:", error);
            } else {
              console.log("Image deleted successfully:", result);
            }
          }
        );
      }
    }
    let expertise = "";
    if (
      documents.expertise !== "" &&
      Object.keys(documents.expertise).length !== 0
    ) {
      if (documents.expertise?.public_id == undefined) {
        if (userDoesExist?.documents.expertise.public_id !== undefined) {
          await cloudinary.uploader.destroy(
            userDoesExist?.documents.expertise.public_id,
            (error, result) => {
              if (error) {
                console.error("Error deleting image:", error);
              } else {
                console.log("Image deleted successfully:", result);
              }
            }
          );
        }
        expertise = await cloudinary.uploader.upload(documents.expertise, {
          folder: `${email}/documents`,
        });
      } else {
        expertise = documents.expertise;
      }
    } else {
      if (userDoesExist?.documents.expertise.public_id !== undefined) {
        await cloudinary.uploader.destroy(
          userDoesExist?.documents.expertise.public_id,
          (error, result) => {
            if (error) {
              console.error("Error deleting image:", error);
            } else {
              console.log("Image deleted successfully:", result);
            }
          }
        );
      }
    }
    let acheivements = "";
    if (
      documents.acheivements !== "" &&
      Object.keys(documents.acheivements).length !== 0
    ) {
      if (documents.acheivements?.public_id == undefined) {
        if (userDoesExist?.documents.acheivements.public_id !== undefined) {
          await cloudinary.uploader.destroy(
            userDoesExist?.documents.acheivements.public_id,
            (error, result) => {
              if (error) {
                console.error("Error deleting image:", error);
              } else {
                console.log("Image deleted successfully:", result);
              }
            }
          );
        }
        acheivements = await cloudinary.uploader.upload(
          documents.acheivements,
          {
            folder: `${email}/documents`,
          }
        );
      } else {
        acheivements = documents.acheivements;
      }
    } else {
      if (userDoesExist?.documents.acheivements.public_id !== undefined) {
        await cloudinary.uploader.destroy(
          userDoesExist?.documents.acheivements.public_id,
          (error, result) => {
            if (error) {
              console.error("Error deleting image:", error);
            } else {
              console.log("Image deleted successfully:", result);
            }
          }
        );
      }
    }
    let degree = "";
    if (documents.degree !== "" && Object.keys(documents.degree).length !== 0) {
      if (documents.degree?.public_id == undefined) {
        if (userDoesExist?.documents.degree.public_id !== undefined) {
          await cloudinary.uploader.destroy(
            userDoesExist?.documents.degree.public_id,
            (error, result) => {
              if (error) {
                console.error("Error deleting image:", error);
              } else {
                console.log("Image deleted successfully:", result);
              }
            }
          );
        }
        degree = await cloudinary.uploader.upload(documents.degree, {
          folder: `${email}/documents`,
        });
      } else {
        degree = documents.degree;
      }
    } else {
      if (userDoesExist?.documents.degree.public_id !== undefined) {
        await cloudinary.uploader.destroy(
          userDoesExist?.documents.degree.public_id,
          (error, result) => {
            if (error) {
              console.error("Error deleting image:", error);
            } else {
              console.log("Image deleted successfully:", result);
            }
          }
        );
      }
    }
    let working = "";
    if (
      documents.working !== "" &&
      Object.keys(documents.working).length !== 0
    ) {
      if (documents.working?.public_id == undefined) {
        if (userDoesExist?.documents.working.public_id !== undefined) {
          await cloudinary.uploader.destroy(
            userDoesExist?.documents.working.public_id,
            (error, result) => {
              if (error) {
                console.error("Error deleting image:", error);
              } else {
                console.log("Image deleted successfully:", result);
              }
            }
          );
        }
        working = await cloudinary.uploader.upload(documents.working, {
          folder: `${email}/documents`,
        });
      } else {
        working = documents.working;
      }
    } else {
      if (documents.working?.public_id == undefined) {
        if (userDoesExist?.documents.working.public_id !== undefined) {
          await cloudinary.uploader.destroy(
            userDoesExist?.documents.working.public_id,
            (error, result) => {
              if (error) {
                console.error("Error deleting image:", error);
              } else {
                console.log("Image deleted successfully:", result);
              }
            }
          );
        }
      }
    }
    let updatedExperience = [];
    if (role === "Technology partner") {
      for (let i = 0; i < experienceDetails.length; i++) {
        let newB = "";
        let newL = "";
        if (experienceDetails[i]?.Banner?.public_id == undefined) {
          if (experienceDetails[i]._id !== undefined) {
            const prevB = await UserUpdate.findOne({
              email: email,
              "experienceDetails._id": experienceDetails[i]._id,
            });
            if (
              prevB &&
              prevB.experienceDetails.find(
                (f) => f._id == experienceDetails[i]._id
              )?.Banner?.public_id !== undefined
            ) {
              await cloudinary.uploader.destroy(
                prevB.experienceDetails.find(
                  (f) => f._id == experienceDetails[i]._id
                )?.Banner.public_id,
                (error, result) => {
                  if (error) {
                    console.error("Error deleting image:", error);
                  } else {
                    console.log("Image deleted successfully:", result);
                  }
                }
              );
            }
          }
          if (experienceDetails[i]?.Banner !== "") {
            newB = await cloudinary.uploader.upload(
              experienceDetails[i]?.Banner,
              {
                folder: `${email}/editProfile/experience/Banner`,
              }
            );
          }
        } else {
          newB = experienceDetails[i]?.Banner;
        }
        if (experienceDetails[i]?.Logo?.public_id == undefined) {
          if (experienceDetails[i]._id !== undefined) {
            const prevL = await UserUpdate.findOne({
              email: email,
              "experienceDetails._id": experienceDetails[i]._id,
            });
            if (
              prevL &&
              prevL.experienceDetails.find(
                (f) => f._id == experienceDetails[i]._id
              )?.Logo?.public_id !== undefined
            ) {
              await cloudinary.uploader.destroy(
                prevL.experienceDetails.find(
                  (f) => f._id == experienceDetails[i]._id
                )?.Logo.public_id,
                (error, result) => {
                  if (error) {
                    console.error("Error deleting image:", error);
                  } else {
                    console.log("Image deleted successfully:", result);
                  }
                }
              );
            }
          }
          if (experienceDetails[i]?.Logo !== "") {
            newL = await cloudinary.uploader.upload(
              experienceDetails[i]?.Logo,
              {
                folder: `${email}/editProfile/experience/Logo`,
              }
            );
          }
        } else {
          newL = experienceDetails[i]?.Logo;
        }
        updatedExperience.push({
          ...experienceDetails[i],
          Banner: newB,
          Logo: newL,
        });
      }
    } else {
      updatedExperience = [...experienceDetails];
    }

    if (userDoesExist) {
      const userExist = await User.findOne({ email: email });

      await UserUpdate.updateOne(
        { email: email },
        {
          $set: {
            userInfo: userExist._id,
            userName,
            image: userExist?.image?.url,
            role,
            phone,
            state: state,
            town: town,
            salutation,
            mentorCategories,
            country: country,
            experienceDetails: updatedExperience,
            educationDetails: educationdetails,
            fee: fee,
            bio: bio,
            verification: "pending",
            skills: skills,
            languagesKnown: languagesKnown,
            documents: {
              resume: {
                public_id: resume?.public_id,
                secure_url: resume?.secure_url,
              },
              expertise: {
                public_id: expertise?.public_id,
                secure_url: expertise?.secure_url,
              },
              acheivements: {
                public_id: acheivements?.public_id,
                secure_url: acheivements?.secure_url,
              },
              degree: {
                public_id: degree?.public_id,
                secure_url: degree?.secure_url,
              },
              working: {
                public_id: working?.public_id,
                secure_url: working?.secure_url,
              },
            },
          },
        }
      );
      await User.updateOne(
        { email: email },
        { $set: { verification: "pending" } }
      );
      const accessToken = await signAccessToken(
        {
          email: userExist.email,
          freeCoins: userDoesExist.freeCoins,
          realCoins: userDoesExist.realCoins,
          documents: userExist.documents,
          user_id: userExist._id,
          role: userExist.role,
          userName: userExist.userName,
          image: userExist.image?.url,
          verification: "pending",
        },
        `${userExist._id}`
      );
      const refreshToken = await signRefreshToken(
        { email: userExist.email, _id: userExist._id },
        `${userExist._id}`
      );

      return res.send({ accessToken: accessToken, refreshToken: refreshToken });
    }

    const userExist = await User.findOne({ email: email });
    await UserUpdate.create({
      userInfo: userExist._id,
      email: email,
      role: role,
      userName: userName,
      phone: phone,
      state: state,
      town: town,
      salutation,
      mentorCategories,
      country: country,
      experienceDetails: updatedExperience,
      educationDetails: educationdetails,
      fee: fee,
      bio: bio,
      image: userExist?.image?.url,
      verification: "pending",
      skills: skills,
      languagesKnown: languagesKnown,
      documents: {
        resume: {
          public_id: resume?.public_id,
          secure_url: resume?.secure_url,
        },
        expertise: {
          public_id: expertise?.public_id,
          secure_url: expertise?.secure_url,
        },
        acheivements: {
          public_id: acheivements?.public_id,
          secure_url: acheivements?.secure_url,
        },
        degree: {
          public_id: degree?.public_id,
          secure_url: degree?.secure_url,
        },
        working: {
          public_id: working?.public_id,
          secure_url: working?.secure_url,
        },
      },
    });
    await User.updateOne(
      { email: email },
      { $set: { verification: "pending" } }
    );

    const accessToken = await signAccessToken(
      {
        email: userExist.email,
        coins: userExist.coins,
        documents: userExist.documents,
        user_id: userExist._id,
        role: userExist.role,
        userName: userExist.userName,
        image: userExist.image?.url,
        verification: "pending",
      },
      `${userExist._id}`
    );
    const refreshToken = await signRefreshToken(
      { email: userExist.email, _id: userExist._id },
      `${userExist._id}`
    );

    return res.send({ accessToken: accessToken, refreshToken: refreshToken });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ message: err });
  }
};


exports.directeditprofile = async (req, res, next) => {
  try {
    const {
      userId,
      email,
      salutation,
      mentorCategories,
      userName,
      role,
      phone,
      documents,
      experienceDetails,
      educationdetails,
      fee,
      bio,
      state,
      town,
      country,
      skills,
      languagesKnown,
    } = req.body;

    // validating email and password

    const userDoesExist = await User.findOne({ email: email });

    let resume = "";
    if (documents.resume !== "" && Object.keys(documents.resume).length !== 0) {
      if (documents.resume?.public_id == undefined) {
        if (userDoesExist?.documents.resume.public_id !== undefined) {
          await cloudinary.uploader.destroy(
            userDoesExist?.documents.resume.public_id,
            (error, result) => {
              if (error) {
                console.error("Error deleting image:", error);
              } else {
                console.log("Image deleted successfully:", result);
              }
            }
          );
        }
        resume = await cloudinary.uploader.upload(documents.resume, {
          folder: `${email}/documents`,
        });
      } else {
        resume = documents.resume;
      }
    } else {
      if (userDoesExist?.documents.resume.public_id !== undefined) {
        await cloudinary.uploader.destroy(
          userDoesExist?.documents.resume.public_id,
          (error, result) => {
            if (error) {
              console.error("Error deleting image:", error);
            } else {
              console.log("Image deleted successfully:", result);
            }
          }
        );
      }
    }
    let expertise = "";
    if (
      documents.expertise !== "" &&
      Object.keys(documents.expertise).length !== 0
    ) {
      if (documents.expertise?.public_id == undefined) {
        if (userDoesExist?.documents.expertise.public_id !== undefined) {
          await cloudinary.uploader.destroy(
            userDoesExist?.documents.expertise.public_id,
            (error, result) => {
              if (error) {
                console.error("Error deleting image:", error);
              } else {
                console.log("Image deleted successfully:", result);
              }
            }
          );
        }
        expertise = await cloudinary.uploader.upload(documents.expertise, {
          folder: `${email}/documents`,
        });
      } else {
        expertise = documents.expertise;
      }
    } else {
      if (userDoesExist?.documents.expertise.public_id !== undefined) {
        await cloudinary.uploader.destroy(
          userDoesExist?.documents.expertise.public_id,
          (error, result) => {
            if (error) {
              console.error("Error deleting image:", error);
            } else {
              console.log("Image deleted successfully:", result);
            }
          }
        );
      }
    }
    let acheivements = "";
    if (
      documents.acheivements !== "" &&
      Object.keys(documents.acheivements).length !== 0
    ) {
      if (documents.acheivements?.public_id == undefined) {
        if (userDoesExist?.documents.acheivements.public_id !== undefined) {
          await cloudinary.uploader.destroy(
            userDoesExist?.documents.acheivements.public_id,
            (error, result) => {
              if (error) {
                console.error("Error deleting image:", error);
              } else {
                console.log("Image deleted successfully:", result);
              }
            }
          );
        }
        acheivements = await cloudinary.uploader.upload(
          documents.acheivements,
          {
            folder: `${email}/documents`,
          }
        );
      } else {
        acheivements = documents.acheivements;
      }
    } else {
      if (userDoesExist?.documents.acheivements.public_id !== undefined) {
        await cloudinary.uploader.destroy(
          userDoesExist?.documents.acheivements.public_id,
          (error, result) => {
            if (error) {
              console.error("Error deleting image:", error);
            } else {
              console.log("Image deleted successfully:", result);
            }
          }
        );
      }
    }
    let degree = "";
    if (documents.degree !== "" && Object.keys(documents.degree).length !== 0) {
      if (documents.degree?.public_id == undefined) {
        if (userDoesExist?.documents.degree.public_id !== undefined) {
          await cloudinary.uploader.destroy(
            userDoesExist?.documents.degree.public_id,
            (error, result) => {
              if (error) {
                console.error("Error deleting image:", error);
              } else {
                console.log("Image deleted successfully:", result);
              }
            }
          );
        }
        degree = await cloudinary.uploader.upload(documents.degree, {
          folder: `${email}/documents`,
        });
      } else {
        degree = documents.degree;
      }
    } else {
      if (userDoesExist?.documents.degree.public_id !== undefined) {
        await cloudinary.uploader.destroy(
          userDoesExist?.documents.degree.public_id,
          (error, result) => {
            if (error) {
              console.error("Error deleting image:", error);
            } else {
              console.log("Image deleted successfully:", result);
            }
          }
        );
      }
    }
    let working = "";
    if (
      documents.working !== "" &&
      Object.keys(documents.working).length !== 0
    ) {
      if (documents.working?.public_id == undefined) {
        if (userDoesExist?.documents.working.public_id !== undefined) {
          await cloudinary.uploader.destroy(
            userDoesExist?.documents.working.public_id,
            (error, result) => {
              if (error) {
                console.error("Error deleting image:", error);
              } else {
                console.log("Image deleted successfully:", result);
              }
            }
          );
        }
        working = await cloudinary.uploader.upload(documents.working, {
          folder: `${email}/documents`,
        });
      } else {
        working = documents.working;
      }
    } else {
      if (documents.working?.public_id == undefined) {
        if (userDoesExist?.documents.working.public_id !== undefined) {
          await cloudinary.uploader.destroy(
            userDoesExist?.documents.working.public_id,
            (error, result) => {
              if (error) {
                console.error("Error deleting image:", error);
              } else {
                console.log("Image deleted successfully:", result);
              }
            }
          );
        }
      }
    }
    let updatedExperience = []
    if (role === 'Technology partner') {
      for (let i = 0; i < experienceDetails.length; i++) {
        let newB = ''
        let newL = ''
        if (experienceDetails[i]?.Banner?.public_id == undefined) {
          if (experienceDetails[i]._id !== undefined) {
            const prevB = await UserUpdate.findOne({ email: email, 'experienceDetails._id': experienceDetails[i]._id })
            if (prevB && prevB.experienceDetails.find(f => f._id == experienceDetails[i]._id)?.Banner?.public_id !== undefined) {
              await cloudinary.uploader.destroy(
                prevB.experienceDetails.find(f => f._id == experienceDetails[i]._id)?.Banner.public_id,
                (error, result) => {
                  if (error) {
                    console.error("Error deleting image:", error);
                  } else {
                    console.log("Image deleted successfully:", result);
                  }
                }
              );
            }
          }
          if (experienceDetails[i]?.Banner !== "") {
            newB = await cloudinary.uploader.upload(experienceDetails[i]?.Banner, {
              folder: `${email}/editProfile/experience/Banner`,
            });
          
          }
        } else {
          newB = experienceDetails[i]?.Banner
        }
        if (experienceDetails[i]?.Logo?.public_id == undefined) {
          if (experienceDetails[i]._id !== undefined) {
            const prevL = await UserUpdate.findOne({ email: email, 'experienceDetails._id': experienceDetails[i]._id })
            if (prevL && prevL.experienceDetails.find(f => f._id == experienceDetails[i]._id)?.Logo?.public_id !== undefined) {
              await cloudinary.uploader.destroy(
                prevL.experienceDetails.find(f => f._id == experienceDetails[i]._id)?.Logo.public_id,
                (error, result) => {
                  if (error) {
                    console.error("Error deleting image:", error);
                  } else {
                    console.log("Image deleted successfully:", result);
                  }
                }
              );
            }
          }
          if (experienceDetails[i]?.Logo !== "") {
            newL = await cloudinary.uploader.upload(experienceDetails[i]?.Logo, {
              folder: `${email}/editProfile/experience/Logo`,
            });

          }
        } else {
          newL = experienceDetails[i]?.Logo
        }
        updatedExperience.push({ ...experienceDetails[i], Banner: newB, Logo: newL })

      }
    } else {
      updatedExperience = [...experienceDetails]
    }

    if (userDoesExist) {

      await User.updateOne(
        { email: email },
        {
          $set: {
            userInfo: userDoesExist._id,
            userName,
            // image: userDoesExist?.image?.url,
            role,
            phone,
            state: state,
            town: town,
            salutation,
            mentorCategories,
            country: country,
            experienceDetails: updatedExperience,
            educationDetails: educationdetails,
            fee: fee,
            bio: bio,
            verification: "",
            skills: skills,
            languagesKnown: languagesKnown,
            documents: {
              resume: {
                public_id: resume?.public_id,
                secure_url: resume?.secure_url,
              },
              expertise: {
                public_id: expertise?.public_id,
                secure_url: expertise?.secure_url,
              },
              acheivements: {
                public_id: acheivements?.public_id,
                secure_url: acheivements?.secure_url,
              },
              degree: {
                public_id: degree?.public_id,
                secure_url: degree?.secure_url,
              },
              working: {
                public_id: working?.public_id,
                secure_url: working?.secure_url,
              },
            },
          },
        }
      );
      const updatedUser = await User.findOne({email:email})
      const accessToken = await signAccessToken(
        {
          email: updatedUser.email,
          freeCoins: updatedUser.freeCoins,
          realCoins: updatedUser.realCoins,
          documents: updatedUser.documents,
          user_id: updatedUser._id,
          role: updatedUser.role,
          userName: updatedUser.userName,
          image: updatedUser.image?.url,
          verification: "",
        },
        `${updatedUser._id}`
      );
      const refreshToken = await signRefreshToken(
        { email: updatedUser.email, _id: updatedUser._id },
        `${updatedUser._id}`
      );

      return res.send({ accessToken: accessToken, refreshToken: refreshToken });
    }

    return res.status(400).send({ message: 'User Not Found' });

  } catch (err) {
    console.log(err);
    return res.status(400).send({ message: err });
  }
};

exports.updateVerification = async (req, res, next) => {
  try {
    const { userId, status } = req.body;
    // Checking user already exist or not
    const userDoesExist = await UserUpdate.findOne({ _id: userId });
    const email = userDoesExist.email;
    if (!userDoesExist) {
      return res.status(404).json({ message: "User not found" });
    }
    await UserUpdate.updateOne(
      { email: email },
      { $set: { verification: status } }
    );
    const adminDetails = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (status == "approved") {
      await User.updateOne(
        { email: email },
        {
          $set: {
            email: userDoesExist.email,
            state: userDoesExist.state,
            town: userDoesExist.town,
            country: userDoesExist.country,
            experienceDetails: userDoesExist.experienceDetails,
            educationDetails: userDoesExist.educationDetails,
            mentorCategories: userDoesExist.mentorCategories,
            salutation: userDoesExist.salutation,
            bio: userDoesExist.bio,
            fee: userDoesExist.fee,
            documents: userDoesExist.documents,
            role: userDoesExist.role,
            userName: userDoesExist.userName,
            phone: userDoesExist.phone,
            verification: status,
            skills: userDoesExist.skills,
            languagesKnown: userDoesExist.languagesKnown,
          },
        }
      );

      await send_Notification_mail(
        email,
        `Profile Update`,
        `Your profile update request has been <b>${req.body.status}</b> by the admin`,
        userDoesExist.userName, '/editProfile'
      );
      await Notification.create({
        senderInfo: adminDetails._id,
        receiver: userDoesExist.userInfo,
        message: `Your profile update request has been ${req.body.status} by the admin.`,
        type: "user",
        read: false,
      });
    } else {
      await User.updateOne(
        { email: email },
        { $set: { verification: status } }
      );
      await send_Notification_mail(
        email,
        `Profile Update`,
        `Your profile update request has been <b>${req.body.status}</b> by the admin and added comment: "<b>${req.body.reason}</b>"`,
        userDoesExist.userName, '/editProfile'
      );
      await Notification.create({
        senderInfo: adminDetails._id,
        receiver: userDoesExist.userInfo,
        message: `Your profile update request has been ${req.body.status} by the admin and added comment: "${req.body.reason}"`,
        type: "user",
        read: false,
      });
    }

    return res.send({ message: `Profile status is ${status} !` });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ message: `Error in Profile updation !` });
  }
};

exports.updateVerificationByAdmin = async (req, res, next) => {
  try {
    const { userId, status } = req.body;
    // Checking user already exist or not
    const userDoesExist = await User.findOne({ _id: userId });
    const email = userDoesExist.email;
    if (!userDoesExist) {
      return res.status(404).json({ message: "User not found" });
    }
  
    const adminDetails = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (status == "approved") {
      await User.updateOne(
        { _id: userId },
        { $set: { verification: status } }
      );

      await send_Notification_mail(
        email,
        `Profile Update`,
        `Your profile update request has been <b>${req.body.status}</b> by the admin`,
        userDoesExist.userName, '/editProfile'
      );
      await Notification.create({
        senderInfo: adminDetails._id,
        receiver: userDoesExist._id,
        message: `Your profile update request has been ${req.body.status} by the admin.`,
        type: "user",
        read: false,
      });
    } else {
      await User.updateOne(
        { email: email },
        { $set: { verification: status } }
      );
      await send_Notification_mail(
        email,
        `Profile Update`,
        `Your profile update request has been <b>${req.body.status}</b> by the admin and added comment: "<b>${req.body.reason}</b>"`,
        userDoesExist.userName, '/editProfile'
      );
      await Notification.create({
        senderInfo: adminDetails._id,
        receiver: userDoesExist.userInfo,
        message: `Your profile update request has been ${req.body.status} by the admin and added comment: "${req.body.reason}"`,
        type: "user",
        read: false,
      });
    }

    return res.send({ message: `Profile status is ${status} !` });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ message: `Error in Profile updation !` });
  }
};

// IT MAY USE FOR USER BLOCK
// exports.chatBlock = async (req, res, next) => {
//     try {
//         const { email, blockEmail } = req.body;
//         // Checking user already exist or not
//         const mainUser = await User.findOne({ email: email, 'chatBlock.email': { $in: [blockEmail] } })
//         const blockingUser = await User.findOne({ email: blockEmail, 'chatBlockedBy.email': { $in: [email]} })
//         if (mainUser) {
//             await User.updateOne({ email: email}, { $pull: { 'chatBlock': {email: blockEmail} } })
//             if (blockingUser) {
//                 await User.updateOne({ email: blockEmail }, { $pull: { 'chatBlockedBy': { email: email } } })
//             }
//             return res.status(200).send({ message: `Unblocked the user` });
//         } else {
//             const blockingUser = await User.findOne({ email: blockEmail })
//             const mainUserDetails = await User.findOne({ email: email })
//             await User.updateOne({ email: email }, { $push: { 'chatBlock': { userInfo: blockingUser._id, email: blockEmail } } })
//             await User.updateOne({ email: blockEmail }, { $push: { 'chatBlockedBy': { userInfo: mainUserDetails._id, email: email } }  })
//             return res.status(200).send({ message: `blocked the user` });
//         }

//     } catch (err) {
//         console.log(err);
//         return res.status(400).send({ message: `Error in Profile updation !` });

//     }
// }

exports.updateVerificationStatusDirectly = async (req, res, next) => {
  try {
    const {userId, verificationStatus} = req.body;
  const userDoesExist = await User.findOne({_id: userId})
  if(userDoesExist){
    await User.updateOne({_id: userId}, {verification: verificationStatus});
    return res.status(200).json({message: 'User verification updated'})
  }
  return res.status(200).json({message: 'User not found'})
  } catch (error) {
    return res.status(200).json({message: error})

  }
}

exports.verifyUserPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // validating email and password
    const validating_email_password = await authSchema.validateAsync(req.body);

    // Checking user already exist or not
    const userDoesExist = await User.findOne({ email: email });
    if (!userDoesExist) {
      return res.status(404).json({ message: "User not found" });
    }

    // comparing password
    if (
      !(await bcrypt.compare(
        validating_email_password.password,
        userDoesExist.password
      ))
    ) {
      return res.status(404).json({ message: "Entered password is wrong" });
    } else {
      return res.send({ message: "Password verification" });
    }
  } catch (err) {
    if (err.isJoi == true) err.status = 422;
    next(err);
  }
};

exports.updateProfileImage = async (req, res, next) => {
  try {
    const { image, userId, email } = req.body;
    const userDoesExist = await User.findOne({ _id: userId });
    if (!userDoesExist) {
      return res.status(400).send("User not found");
    }
    if (userDoesExist.image.public_id !== undefined) {
      await cloudinary.uploader.destroy(
        userDoesExist.image.public_id,
        (error, result) => {
          if (error) {
            console.error("Error deleting image:", error);
          } else {
            console.log("Image deleted successfully:", result);
          }
        }
      );
    }
    const result = await cloudinary.uploader.upload(image, {
      folder: `${email}`,
    });
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          image: {
            public_id: result.public_id,
            url: result.secure_url,
          },
        },
      }
    );
    const accessToken = await signAccessToken(
      {
        email: userDoesExist.email,
        coins: userDoesExist.coins,
        documents: userDoesExist.documents,
        user_id: userDoesExist._id,
        role: userDoesExist.role,
        userName: userDoesExist.userName,
        image: result.secure_url,
        verification: userDoesExist.verification,
      },
      `${userDoesExist._id}`
    );
    const refreshToken = await signRefreshToken(
      { email: userDoesExist.email, _id: userDoesExist._id },
      `${userDoesExist._id}`
    );

    return res.send({ accessToken: accessToken, refreshToken: refreshToken });
  } catch (err) {
    console.log(err);
    return res.status(400).json("Error while updating profile");
  }
};

exports.deleteProfileImage = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const userDoesExist = await User.findOne({ _id: userId });
    if (!userDoesExist) {
      return res.status(400).send("User not found");
    }
    if (userDoesExist.image.public_id !== undefined) {
      await cloudinary.uploader.destroy(
        userDoesExist.image.public_id,
        (error, result) => {
          if (error) {
            console.error("Error deleting image:", error);
          } else {
            console.log("Image deleted successfully:", result);
          }
        }
      );
    }
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          image: "",
        },
      }
    );
    const accessToken = await signAccessToken(
      {
        email: userDoesExist.email,
        coins: userDoesExist.coins,
        documents: userDoesExist.documents,
        user_id: userDoesExist._id,
        role: userDoesExist.role,
        userName: userDoesExist.userName,
        verification: userDoesExist.verification,
        image: "",
      },
      `${userDoesExist._id}`
    );
    const refreshToken = await signRefreshToken(
      { email: userDoesExist.email, _id: userDoesExist._id },
      `${userDoesExist._id}`
    );

    return res.send({ accessToken: accessToken, refreshToken: refreshToken });
  } catch (err) {
    console.log(err);
    return res.status(400).json("Error while updating profile");
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { type } = req.body;
    if (type !== "") {
      let result = await User.find(
        { role: type },
        { projection: { password: 0 } }
      ).populate({
        path: "followers",
        select: ["userName", "image", "role", '_id'],
      }).populate({
        path: "following",
        select: ["userName", "image", "role", '_id'],
      });
      return res.status(200).json(result);
    } else {
      let result = await User.find({}, { password: 0 }).populate({
        path: "followers",
        select: ["userName", "image", "role", '_id'],
      }).populate({
        path: "following",
        select: ["userName", "image", "role", '_id'],
      });
      return res.status(200).json(result);
    }
  } catch (err) {
    return res.status(400).json("Error while fetching");
  }
};

exports.getAllUserProfileRequests = async (req, res, next) => {
  try {
    const { filters } = req.body;
    const result = await User.find();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json("Error while fetching");
  }
};

exports.addUserReviewStars = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    const reviewSentUser = await User.findOne({
      _id: req.body.review.reviewBy,
    });
    if (user) {
      const userExists = await User.findOne({
        _id: req.body.userId,
        "review.reviewBy": req.body.review.reviewBy,
      });
      if (userExists) {
        await User.updateOne(
          { _id: req.body.userId, "review.reviewBy": req.body.review.reviewBy },
          { "review.$.review": req.body.review.review }
        );
        await send_Notification_mail(
          user.email,
          `Added Stars to the pitch!`,
          `${reviewSentUser.userName} has added ${req.body.review.review} stars to your profile. Check notification for more info.`,
          user.userName, '/editProfile'
        );
        await Notification.create({
          senderInfo: reviewSentUser._id,
          receiver: user._id,
          message: `${reviewSentUser.userName} has added ${req.body.review.review} stars to your profile.`,
          type: "user",
          read: false,
        });
        return res.status(200).json("Review updated");
      }
      const reviewUser = await User.findOne({ _id: req.body.review.reviewBy });
      await User.updateOne(
        { _id: req.body.userId },
        { $push: { review: req.body.review, reviewBy: reviewUser._id } }
      );
      await send_Notification_mail(
        user.email,
        `Added Stars to the pitch!`,
        `${user.userName} has added ${req.body.review.review} . Check notification for more info.`,
        user.userName, '/editProfile'
      );
      await Notification.create({
        senderInfo: user._id,
        receiver: user._id,
        message: `${user.userName} has added ${req.body.review.review} .`,
        type: "user",
        read: false,
      });
      return res.status(200).json("Review added");
    }
    return res.status(400).json("No User Found");
  } catch (err) {
    console.log(err);
    return res.status(400).json(err);
  }
};

exports.getUserReviewStars = async (req, res, next) => {
  try {
    const user = await User.findOne(
      { _id: req.body.userId, "review.reviewBy": req.body.reviewBy },
      { "review.$": 1 }
    ).populate({
      path: "review.reviewBy",
      select: ["userName", "image", "role"],
    });

    if (user) {
      return res.status(200).json(user.review.length > 0 && user.review[0]);
    }
    return res.status(200).json({});
  } catch (err) {
    return res.status(400).json(err);
  }
};

exports.addUserComment = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.userEmail });
    const commentUser = await User.findOne({ email: req.body.comment.email });
    if (user) {
      const user = await User.findOne({ email: req.body.comment.email });
      await User.updateOne(
        { email: req.body.userEmail },
        {
          $push: {
            comments: {
              ...req.body.comment,
              commentBy: commentUser._id,
              createdAt: new Date(),
            },
          },
        }
      );
      return res.status(200).json("Comment added");
    }
    return res.status(400).json("No User Found");
  } catch (err) {
    return res.status(400).json(err);
  }
};

exports.removeUserComment = async (req, res, next) => {
  try {
    const pitch = await User.findOne({ email: req.body.email });
    if (pitch) {
      const commentExist = await User.findOne({
        "comments._id": req.body.commentId,
      });
      await User.updateOne(
        { email: req.body.email },
        { $pull: { comments: { _id: req.body.commentId } } }
      );
      return res.status(200).json("Comment Deleted");
    }
    return res.status(400).json("No User Found");
  } catch (err) {
    console.log(err);
    return res.status(400).json(err);
  }
};

exports.addPayment = async (req, res, next) => {
  try {
    const paymentExist = await User.findOne({
      "payment.email": req.body.senderEmail,
    });
    if (paymentExist) {
      await User.updateOne(
        { email: req.body.email, "payment.email": req.body.senderEmail },
        {
          $inc: {
            "payment.$.moneyPaid": +req.body.money,
            "payment.$.noOfTimes": 1,
          },
        }
      );
      return res.status(200).json("Payment Added");
    }
    const userExist = User.findOne({ email: req.body.senderEmail });
    await User.updateOne(
      { email: req.body.email },
      {
        $push: {
          payment: {
            email: req.body.senderEmail,
            profile_pic: userExist?.image?.url,
            role: userExist?.role,
            moneyPaid: req.body.money,
            noOfTimes: 1,
            createdAt: new Date(),
          },
        },
      }
    );
    return res.status(200).json("Payment added");
  } catch (err) {
    console.log(err);
    return res.status(400).json(err);
  }
};
