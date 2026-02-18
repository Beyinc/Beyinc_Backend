const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const { signEmailOTpToken } = require("./jwt_helpers");
const Userverify = require("../models/OtpModel");
dotenv.config({ path: "../config.env" });

const send_Notification_mail = async (to, subject, body, userName, fLink, ...args) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL, // Replace with your Gmail email address
        pass: process.env.EMAIL_PASSWORD, // Replace with your Gmail password (or use an app password)
      },
    });

    // Extract community link from args if present
    let communityLink = "";
    if (args.length > 0 && typeof args[0] === 'object' && args[0].communityLink) {
      communityLink = args[0].communityLink;
    }

    // Email options
    const mailOptions = {
      from: process.env.EMAIL, // Replace with your Gmail email address
      to: to,
      subject: subject,
      html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e1e4e8;">
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="cid:logo" alt="Bloomr Logo" style="max-width: 150px; height: auto;">
            </div>
            <h2 style="color: #333; margin-bottom: 20px; font-weight: 600; text-align: center;">Welcome to Bloomr!</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Hi <b>${userName}</b>,</p>
            <div style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
                ${body}
            </div>
            
            ${communityLink ? `
            <div style="margin-bottom: 20px; text-align: center;">
                <p style="margin: 0 0 15px; color: #333; font-weight: 600;">Join our Community and connect with others!</p>
                <a href="${communityLink}" style="display: inline-block; padding: 12px 30px; background-color: #25D366; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; box-shadow: 0 2px 5px rgba(37, 211, 102, 0.2);">Join WhatsApp Community</a>
            </div>
            ` : ''}

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.BEYINC_SITE + fLink}" style="display: inline-block; padding: 12px 30px; background-color: #6a73fa; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">Go to Bloomr</a>
            </div>
                   
            <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                <p style="color: #888; font-size: 14px; margin: 0;">Best Regards,<br><b>The Bloomr Team</b></p>
                <p style="color: #aaa; font-size: 12px; margin-top: 15px;">&copy; ${new Date().getFullYear()} Bloomr. All rights reserved.</p>
            </div>
            </div>
       `,
      attachments: [
        {
          filename: "logo.png", // convert your SVG to PNG first
          path: __dirname + "/../assets/Bloomr-login-logo.png", // path to the image in your project
          cid: "logo" // same as used in the HTML
        }
      ]
    };

    // Send email
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.log(error, "Internal Server Error");
      } else {
        if (args.length > 0 && args[0]['otp'] !== undefined) {
          const userFind = await Userverify.findOne({ email: to });
          const otpToken = await signEmailOTpToken({ otp: args[0]['otp']?.toString() });
          if (userFind) {
            await Userverify.updateOne(
              { email: to },
              { $set: { verifyToken: otpToken } }
            );
          } else {
            await Userverify.create({ email: to, verifyToken: otpToken });
          }
        }

        console.log("Email sent successfully");
      }
    });
  } catch (err) {
    console.log(err);
  }
};

module.exports = send_Notification_mail;
