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

exports.register = async (req, res, next) => {
  try {
    const { email, password, phone, role, userName } = req.body;
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
    const phoneExist = await User.findOne({ phone: phone });
    const ErrorMessages = [];
    if (userDoesExist) {
      ErrorMessages.push("Email");
      // return res.status(404).json({message: 'Email Already Exist'})
    }
    if (userNameDoesExist) {
      ErrorMessages.push("User Name ");
      // return res.status(404).json({message: 'User Name Already Exist'})
    }
    if (phoneExist) {
      ErrorMessages.push("Phone Number ");
      // return res.status(404).json({message: 'Phone Number Already Exist'})
    }

    if (ErrorMessages.length > 0) {
      return res
        .status(404)
        .json({ message: ErrorMessages.join(",") + "Already exists" });
    }
    await User.create({
      email,
      password: passwordHashing,
      phone,
      role,
      userName,
      freeCoins: "100",
      realCoins: "0",
      verification: "initial",
    });
    const userDetails = await User.findOne({ email: email });

    const accessToken = await signAccessToken(
      { email: email, user_id: userDetails._id },
      `${userDetails._id}`
    );
    const refreshToken = await signRefreshToken(
      { email: email, user_id: userDetails._id },
      `${userDetails._id}`
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
          freeCoins: userDoesExist.freeCoins,
          realCoins: userDoesExist.realCoins,
          documents: userDoesExist.documents,
          user_id: userDoesExist._id,
          role: userDoesExist.role,
          userName: userDoesExist.userName,
          image: userDoesExist.image?.url,
          verification: userDoesExist.verification,
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
        freeCoins: userDoesExist.freeCoins,
        realCoins: userDoesExist.realCoins,
        documents: userDoesExist.documents,
        user_id: userDoesExist._id,
        role: userDoesExist.role,
        userName: userDoesExist.userName,
        image: userDoesExist.image?.url,
        verification: userDoesExist.verification,
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
        freeCoins: userDoesExist.freeCoins,
        realCoins: userDoesExist.realCoins,
        documents: userDoesExist.documents,
        user_id: userDoesExist._id,
        role: userDoesExist.role,
        userName: userDoesExist.userName,
        image: userDoesExist.image?.url,
        verification: userDoesExist.verification,
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
        freeCoins: userDoesExist.freeCoins,
        realCoins: userDoesExist.realCoins,
        documents: userDoesExist.documents,
        user_id: userDoesExist._id,
        role: userDoesExist.role,
        userName: userDoesExist.userName,
        image: userDoesExist.image?.url,
        verification: userDoesExist.verification,
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
    console.log(phone.slice(3));
    if (phoneexist && type !== 'forgot' && type !== 'login') {
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

exports.send_otp_mail = async (req, res, next) => {
  try {
    const { to, subject, type } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL, // Replace with your Gmail email address
        pass: process.env.EMAIL_PASSWORD, // Replace with your Gmail password (or use an app password)
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL, // Replace with your Gmail email address
      to: to,
      subject: subject,
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1); border-top: 4px solid #6a73fa; border-bottom: 4px solid #6a73fa;">
        <img src="https://github.com/ShivaShankarGoddumarri/User-Images/assets/96565316/4dc1cd87-df3a-4aa8-81ff-5eb6c54d370a" alt="Email Banner" style="display: block; margin: 0 auto 20px; max-width: 40%; height: auto;">
        <p>Hi ${to.split('@')[0]},</p>
        <p>Your one-time password for <b>BEYINC ${type}</b> is <b>${otp.toString()}</b> valid for the next 2 minutes. For safety reasons, <b>PLEASE DO NOT SHARE YOUR OTP</b> with anyone. </p>
        <div style="margin: 0 auto; background-color: #f0f0f0; padding: 10px; border-radius: 5px; margin-top: 20px; text-align: center; width: 150px;">
          <p style="font-size: 24px; margin: 0;">${otp.toString()}</p>
          <a href = ${
            process.env.BEYINC_SITE
          } style="display: inline-block; padding: 10px 20px; background-color: #6a73fa; color: #fff; text-decoration: none; border-radius: 5px;">Go to BeyInc</a>       
        </div>
         <p style="margin-top: 20px;">Best Regards,<br><b>BeyInc</b></p>
        <div style="margin-top: 20px; background-color: #f0f0f0; padding: 10px; border-radius: 5px; text-align: center;">
            <p style="margin: 0;">&copy; Copyright BeyInc</p>
          </div>
      </div>
       `,
    };

    // Send email
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        res.status(500).send("Internal Server Error");
      } else {
        const userFind = await Userverify.findOne({ email: to });
        const otpToken = await signEmailOTpToken({ otp: otp.toString() });
        if (userFind) {
          await Userverify.updateOne(
            { email: to },
            { $set: { verifyToken: otpToken } }
          );
        } else {
          await Userverify.create({ email: to, verifyToken: otpToken });
        }
        res.status(200).send("Email sent successfully");
      }
    });
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
      console.log(otp, req.body.otp);
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
