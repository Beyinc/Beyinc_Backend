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
const Coupon = require("../models/Coupon");
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });
const twilio = require("twilio");
const UserUpdate = require("../models/UpdateApproval");
const cloudinary = require("../helpers/UploadImage");
const Notification = require("../models/NotificationModel");
const send_Notification_mail = require("../helpers/EmailSending");
const jobTitles = require("../models/Roles");
const { $_match } = require("@hapi/joi/lib/base");
const mongoose = require("mongoose");
const razorpay = require("../helpers/Razorpay");
const { generateUniqueCode } = require('../helpers/UniqueCode');



exports.getCouponsForUser = async function(req, res) {
    try {
        const userId = req.payload.user_id;
        const coupons = await Coupon.find({ userId: userId });
  
        res.status(200).json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  async function generateCoupon(userId, discount) {
    const code = generateUniqueCode();
    const coupon = new Coupon({
        code: code,
        discount: discount,
        userId: userId
    });
    await coupon.save();
    return code;
  }
  
  
  exports.applyReferral = async function(req, res) {
  
    console.log("apply referral is working");
    
  
    // Log the entire request body for debugging
    console.log("Request Body:", req.payload);
  
    const { referralCode } = req.body;
    console.log("Referral Code:", referralCode);

    console.log("user Id:", req.payload.user_id);

    const id = req.payload.user_id;
  

    try {
      const user = await User.findOne({ _id: id });

      const discount = 10;
  
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }
  
      // Check if the user has already used a referral code
      if (user.referralCode.used) {
          return res.status(400).json({ error: 'Referral code has already been used' });
      }
  
      const referrer = await User.findOne({ 'referralCode.code': referralCode });
      if (!referrer) {
          return res.status(400).json({ error: 'Invalid referral code' });
      }
  
      // Check if the user is already referred by this referrer
      if (referrer.referredTo.includes(id)) {
          return res.status(400).json({ error: 'Referral is already used' });
      }
  
      // Add user to referrer's referredTo array if not already present
      referrer.referredTo.push(id);
      
      // Mark the user's referral code as used
      user.referralCode.used = true;
  
      // Save the referrer and user documents
      await referrer.save();
      await user.save();
        console.log("referrer", referrer)
        console.log("user", user)
  
        const referrerDiscountCode = await generateCoupon(referrer._id, discount);
        const newUserDiscountCode = await generateCoupon(user._id, discount);
  
       
  
        res.status(200).json({
            message: 'Referral applied successfully',
            referrerDiscountCode: referrerDiscountCode,
            newUserDiscountCode: newUserDiscountCode
        });
        
        await send_Notification_mail(
            user.email,
            "Referral applied successfully",
            `Referral applied successfully. Hurray!, You get a coupon code ${newUserDiscountCode} with ${discount}% discount. `,
            "",
            ""
          );
        await send_Notification_mail(
            referrer.email,
            "Referral applied by your friend",
            `Referral applied by ${user.userName}. Hurray!, You get a coupon code ${referrerDiscountCode} with ${discount}% discount. `,
            "",
            ""
        );
        await send_Notification_mail(
            process.env.ADMIN_EMAIL,
            "Referral applied by our User",
            `A new user <b>${user.userName}</b> applied Referral Code ${referralCode}. ${user.userName} get coupon code ${newUserDiscountCode} with ${discount}% discount. ${referrer.userName} get coupon code ${referrerDiscountCode} with ${discount}% discount.  `,
            process.env.ADMIN_EMAIL,
            ""
        );
    } 
    catch (error) {
        console.error('Error during referral application:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  