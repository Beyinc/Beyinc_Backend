const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const Razorpay = require("razorpay");

// Add console.log to check if the environment variables are loaded
// console.log("RAZORPAY_API_KEY:", process.env.RAZORPAY_API_KEY);
// console.log("RAZORPAY_APT_SECRET:", process.env.RAZORPAY_APT_SECRET);

exports.razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_APT_SECRET,
});
