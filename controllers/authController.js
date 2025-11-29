const { authSchema } = require("../helpers/validations");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signEmailOTpToken,
  verifyEmailOtpToken,
  verifyAccessToken,
  verifyAPiAccessToken,
} = require("../helpers/jwt_helpers");
const User = require("../models/UserModel");
const dotenv = require("dotenv");
const Userverify = require("../models/OtpModel");
dotenv.config({ path: "../config.env" });
const twilio = require("twilio");
const { exist } = require("@hapi/joi");
const send_Notification_mail = require("../helpers/EmailSending");
const { generateUniqueCode } = require('../helpers/UniqueCode');


exports.register = async (req, res, next) => {
  try {
    const { email, password, role, userName } = req.body;
    console.log("request reached register with this data",req.body)
    const freeDemoCode = {
      code: generateUniqueCode(),
      used: false
    };
    const newReferralCode = {
        code: generateUniqueCode(),
        used: false
    };
    referredto = [];

    // console.log( {"freeDemoCode": freeDemoCode,
    //   "referralCode": newReferralCode,
    //   "referredTo": referredto
    // });

    // validating email and password
    const validating_email_password = await authSchema.validateAsync(req.body);

    // hashing password
    const salt = await bcrypt.genSalt(10);
    const passwordHashing = await bcrypt.hash(
      validating_email_password.password,
      salt
    );

    // Checking user already exist or not
    const userDoesExist = await User.findOne({ email: email });
    const userNameDoesExist = await User.findOne({ userName: userName });
    const ErrorMessages = [];
    if (userDoesExist) {
      ErrorMessages.push("Email");
      // return res.status(404).json({message: 'Email Already Exist'})
    }
    if (userNameDoesExist) {
      ErrorMessages.push("User Name ");
      // return res.status(404).json({message: 'User Name Already Exist'})
    }
    // if (phoneExist) {
    //   ErrorMessages.push("Phone Number ");
    //   // return res.status(404).json({message: 'Phone Number Already Exist'})
    // }

    if (ErrorMessages.length > 0) {
      return res
        .status(404)
        .json({ message: ErrorMessages.join(",") + "Already exists" });
    }
    await User.create({
      email,
      password: passwordHashing,
      role,
      userName,
      freeMoney: 100,
      realMoney: 0,
      verification: "initial",
      freeDemoCode: freeDemoCode,
      referralCode: newReferralCode,
      referredTo: referredto,
    });
    const userDetails = await User.findOne({ email: email });

    const accessToken = await signAccessToken(
      {
        email: userDetails.email,
        freeMoney: userDetails.freeMoney,
        realMoney: userDetails.realMoney,
        documents: userDetails.documents,
        user_id: userDetails._id,
        role: userDetails.role,
        userName: userDetails.userName,
        image: userDetails.image?.url,
        verification: userDetails.verification,
        freeDemoCode: userDetails.freeDemoCode,
        referralCode: userDetails.referralCode,
        referredTo: userDetails.referredto,
      },
      `${userDetails._id}`
    );
    const refreshToken = await signRefreshToken(
      { email: userDetails.email, _id: userDetails._id },
      `${userDetails._id}`
    );

    console.log("created account", userDetails)

    return res.send({ accessToken: accessToken, refreshToken: refreshToken });
  } catch (err) {
    if (err.isJoi == true) err.status = 422;
    next(err);
  }
};

exports.googleSSORegister = async (req, res, next) => {
  try {
    const { email, userName, role } = req.body;
    console.log(req.body)
    const freeDemoCode = {
      code: generateUniqueCode(),
      used: false
    };
    const newReferralCode = {
        code: generateUniqueCode(),
        used: false
    };
    referredto = [];

    // console.log( {"freeDemoCode": freeDemoCode,
    //   "referralCode": newReferralCode,
    //   "referredTo": referredto
    // });

    // Checking user already exist or not
    const userDoesExist = await User.findOne({ email: email });
    if (!userDoesExist) {
      // hashing password
      const salt = await bcrypt.genSalt(10);
      const passwordHashing = await bcrypt.hash(`${userName}@Beyinc1`, salt);
      const newUser = await User.create({
        email,
        role,
        password: passwordHashing,
        userName,
        freeMoney: 100,
        realMoney: 0,
        freeDemoCode: freeDemoCode,
        referralCode: newReferralCode,
        referredTo: referredto,
        
      });
      const accessToken = await signAccessToken(
        {
          email: email, user_id: newUser._id, freeMoney: newUser.freeMoney,
          realMoney: newUser.realMoney, 
          freeDemoCode: newUser.freeDemoCode,
          referralCode: newUser.newReferralCode,
          referredTo: newUser.referredto, },
        `${newUser._id}`
      );
      const refreshToken = await signRefreshToken(
        { email: email, user_id: newUser._id },
        `${newUser._id}`
      );
      await send_Notification_mail(
        email,
        "Beyinc System generated password for you",
        `Your temporary password is <b>${userName}@Beyinc1</b>. If you want to change password please logout and change that in forgot password page`,
        userName,
        ""
      );
      await send_Notification_mail(
        process.env.ADMIN_EMAIL,
        "New User joined!",
        `A new user <b>${userName}</b> is joined into our app.`,
        process.env.ADMIN_EMAIL,
        ""
      );

      return res.send({ accessToken: accessToken, refreshToken: refreshToken });
    }

    const accessToken = await signAccessToken(
      { email: email, user_id: userDoesExist._id },
      `${userDoesExist._id}`
    );
    const refreshToken = await signRefreshToken(
      { email: email, user_id: userDoesExist._id },
      `${userDoesExist._id}`
    );

    return res.send({ accessToken: accessToken, refreshToken: refreshToken });
  } catch (err) {
    if (err.isJoi == true) err.status = 422;
    next(err);
  }
};

exports.login = async (req, res, next) => {
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
      return res.status(404).json({ message: "Email/password is wrong" });
    } else {
      const accessToken = await signAccessToken(
        {
          email: userDoesExist.email,
          freeMoney: userDoesExist.freeMoney,
          realMoney: userDoesExist.realMoney,
          documents: userDoesExist.documents,
          user_id: userDoesExist._id,
          role: userDoesExist.role,
          userName: userDoesExist.userName,
          image: userDoesExist.image?.url,
          verification: userDoesExist.verification,
          freeDemoCode: userDoesExist.freeDemoCode,
          referralCode: userDoesExist.referralCode,
          referredTo:userDoesExist.referredTo
        },
        `${userDoesExist._id}`
      );
      const refreshToken = await signRefreshToken(
        { email: userDoesExist.email, _id: userDoesExist._id },
        `${userDoesExist._id}`
      );

      return res.send({ accessToken: accessToken, refreshToken: refreshToken });
    }
  } catch (err) {
    if (err.isJoi == true) err.status = 422;
    next(err);
  }
};

exports.mobile_login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    // const validating_email_password = await authSchema.validateAsync(req.body);

    // Checking user already exist or not
    const userDoesExist = await User.findOne({ phone: phone });
    if (!userDoesExist) {
      return res.status(404).json({ message: "User not found" });
    }

    // comparing password
    // if (
    //   !(await bcrypt.compare(
    //     validating_email_password.password,
    //     phoneExist.password
    //   ))
    // ) {
    //   return res
    //     .status(404)
    //     .json({ message: "Phone Number/password is wrong" });
    // } else {
    const accessToken = await signAccessToken(
      {
        email: userDoesExist.email,
        freeMoney: userDoesExist.freeMoney,
        realMoney: userDoesExist.realMoney,
        documents: userDoesExist.documents,
        user_id: userDoesExist._id,
        role: userDoesExist.role,
        userName: userDoesExist.userName,
        image: userDoesExist.image?.url,
        verification: userDoesExist.verification,
        freeDemoCode: userDoesExist.freeDemoCode,
        referralCode: userDoesExist.referralCode,
        referredTo:userDoesExist.referredTo
      },
      `${userDoesExist._id}`
    );
    const refreshToken = await signRefreshToken(
      { email: userDoesExist.email, _id: userDoesExist._id },
      `${userDoesExist._id}`
    );

    return res
      .status(200)
      .send({ accessToken: accessToken, refreshToken: refreshToken });
    // }
  } catch (err) {
    if (err.isJoi == true) err.status = 422;
    next(err);
  }
};



exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Bad request" });
    }
    const { user_id, email } = await verifyRefreshToken(refreshToken);
    const userDoesExist = await User.findOne({ email: email });
    const accessToken = await signAccessToken(
      {
        email: userDoesExist.email,
        freeMoney: userDoesExist.freeMoney,
        realMoney: userDoesExist.realMoney,
        documents: userDoesExist.documents,
        user_id: userDoesExist._id,
        role: userDoesExist.role,
        userName: userDoesExist.userName,
        image: userDoesExist.image?.url,
        verification: userDoesExist.verification,
        freeDemoCode: userDoesExist.freeDemoCode,
        referralCode: userDoesExist.referralCode,
        referredTo:userDoesExist.referredTo
      },
      `${user_id}`
    );
    const refreshtoken = await signRefreshToken(
      { email: email, user_id: user_id },
      `${user_id}`
    );

    return res.send({ accessToken: accessToken, refreshToken: refreshtoken });
  } catch (err) {
    return res.status(400).json(err);
  }
};

exports.verifyMainAccessToken = async (req, res, next) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ message: "Bad request" });
    }
    const { email } = await verifyAPiAccessToken(accessToken);
    const userDoesExist = await User.findOne({ email: email });
    const currentaccessToken = await signAccessToken(
      {
        email: userDoesExist.email,
        freeMoney: userDoesExist.freeMoney,
        realMoney: userDoesExist.realMoney,
        documents: userDoesExist.documents,
        user_id: userDoesExist._id,
        role: userDoesExist.role,
        userName: userDoesExist.userName,
        image: userDoesExist.image?.url,
        verification: userDoesExist.verification,
        freeDemoCode: userDoesExist.freeDemoCode,
        referralCode: userDoesExist.referralCode,
        referredTo:userDoesExist.referredTo
      },
      `${userDoesExist._id}`
    );
    const refreshToken = await signRefreshToken(
      { email: userDoesExist.email, _id: userDoesExist._id },
      `${userDoesExist._id}`
    );
    return res.send({
      accessToken: currentaccessToken,
      refreshToken: refreshToken,
    });
  } catch (err) {
    return res.status(400).json(err);
  }
};

exports.mobile_otp = async (req, res, next) => {
  try {
    const { phone, type } = req.body;
    const phoneexist = await User.findOne({ phone: phone.slice(3) });
    if (phoneexist && type !== "forgot" && type !== "login") {
      return res.status(400).json("Phone number already exists");
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const accountSid = process.env.TWILIO_ACCOUNTSID;
    const authToken = process.env.TWILIO_AUTHTOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE;

    const client = twilio(accountSid, authToken);
    client.messages
      .create({
        body: `Your one-time Beyinc verification code: ${otp}`,
        from: twilioPhoneNumber,
        to: phone,
      })
      .then(async (message) => {
        const userFind = await Userverify.findOne({ email: phone });
        const otpToken = await signEmailOTpToken({ otp: otp.toString() });
        if (userFind) {
          await Userverify.updateOne(
            { email: phone },
            { $set: { verifyToken: otpToken } }
          );
        } else {
          await Userverify.create({ email: phone, verifyToken: otpToken });
        }
        res.status(200).send("OTP sent successfully");
      })
      .catch((error) => {
        console.error("Error sending OTP via SMS:", error);
        res.status(500).send("Error sending OTP via SMS");
      });
  } catch (err) {
    console.error("Error sending OTP via SMS:", err);
    next(err);
  }
};

exports.forgot_password = async (req, res, next) => {
  try {
    const { email, password, type, phone } = req.body;

    // validating email and password
    // const validating_email_password = await authSchema.validateAsync(req.body);
    const salt = await bcrypt.genSalt(10);
    const passwordHashing = await bcrypt.hash(password, salt);
    if (type == "email") {
      const userDoesExist = await User.findOne({ email: email });
      if (!userDoesExist) {
        return res.status(404).json({ message: "User not found" });
      }
      await User.updateOne(
        { email: email },
        { $set: { password: passwordHashing } }
      );
      // await User.save()
      return res.status(200).json({ message: "Password changed successfully" });
    } else if (type == "mobile") {
      const userDoesExist = await User.findOne({ phone: phone });
      if (!userDoesExist) {
        return res.status(404).json({ message: "User not found" });
      }
      await User.updateOne(
        { phone: phone },
        { $set: { password: passwordHashing } }
      );
      // await User.save()
      return res.status(200).json({ message: "Password changed successfully" });
    }
  } catch (err) {
    next(err);
  }
};

exports.send_otp_mail = async (req, res) => {
  try {
    const { to, subject, type } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    await send_Notification_mail(
      to,
      subject,
      `Your one-time password for <b>Frontend ${type}</b> is <b>${otp.toString()}</b> valid for the next 2 minutes. For safety reasons, <b>PLEASE DO NOT SHARE YOUR OTP</b> with anyone.`,
      to,
      "",
      { otp: otp }
    );
    return res.status(200).send("Email sent successfully");
  } catch (err) {
    console.log(err);
  }
};

exports.verify_otp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const EmailToken = await Userverify.findOne({ email: email });
    if (EmailToken) {
      const { otp } = await verifyEmailOtpToken(EmailToken.verifyToken);
      // console.log(otp, req.body.otp);
      if (req.body.otp == otp) {
        return res.status(200).json({ message: "OTP is Success" });
      } else {
        return res.status(404).json({ message: "Entered OTP is wrong" });
      }
    } else {
      return res.status(404).json({ message: "Please request a Otp" });
    }
  } catch (err) {
    return res.status(404).json({ message: err });
  }
};
