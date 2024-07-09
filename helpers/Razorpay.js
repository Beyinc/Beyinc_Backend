const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });
const Razorpay = require("razorpay");




const instance = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_APT_SECRET,
  });
  
  module.exports = { instance };
  

