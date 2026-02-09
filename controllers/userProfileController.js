const User = require("../models/UserModel");
const cloudinary = require("../helpers/UploadImage");
const { default: mongoose } = require("mongoose");
const userVerify = require("../models/OtpModel");
const send_Notification_mail = require("../helpers/EmailSending");

const generateInviteTemplate = (founderName, startupName, otp) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #6d28d9; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">Co-Founder Invitation</h2>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333; line-height: 1.5;">
          <strong>${founderName}</strong> has invited you to join <strong>${startupName}</strong> as a Co-Founder on our platform.
        </p>
        <p style="font-size: 16px; color: #333;">
          To accept this invitation and verify your email, please provide the following One-Time Password (OTP) to the founder:
        </p>
        
        <div style="margin: 30px 0; text-align: center;">
          <span style="background-color: #f3f4f6; padding: 15px 30px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #6d28d9; border-radius: 8px; border: 1px dashed #6d28d9;">
            ${otp}
          </span>
        </div>

        <p style="font-size: 14px; color: #666; text-align: center;">
          This code will expire in 10 minutes.
        </p>
      </div>
      <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
        &copy; ${new Date().getFullYear()} Your Platform Name. All rights reserved.
      </div>
    </div>
  `;
};
// const send_Notification_mail = require("../helpers/EmailSending");
const getStartupVerificationTemplate = (founderName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
      <p>Hi <strong>${founderName || 'Founder'}</strong>,</p>
      
      <p>
        We’ve just rolled out <strong>Startup Verification</strong> on Bloomr, designed to help serious early-stage founders stand out and get discovered faster.
      </p>

      <p>Once verified, your startup receives:</p>
      
      <ul style="padding-left: 20px; color: #444;">
        <li>Better visibility across the platform</li>
        <li>Priority listing when mentors browse startups</li>
        <li>Verified badge that signals credibility to peers and mentors</li>
        <li>Higher trust when engaging in discussions and feedback threads</li>
        <li>Early access to upcoming founder-only features and experiments</li>
      </ul>

      <p>
        The verification fee is a one-time <span style="text-decoration: line-through;">₹199</span>.<br/>
        <strong>However, as an early Bloomr user, verification is completely free for you!</strong>
      </p>

      <div style="margin: 30px 0; text-align: center;">
        <a href="https://forms.gle/hDEe8khij9rfatNz7" style="background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Click here to get verified →
        </a>
      </div>

      <p>
        If you’re actively building or validating an idea, this is the easiest way to increase signal, visibility, and quality interactions around your startup.
      </p>
      
      <p>See you inside,<br/>
      <strong>Team Bloomr</strong></p>
    </div>
  `;
};

// Save User Data Function
exports.saveData = async (req, res) => {
  const { bio, experience, education, skills, user_id } = req.body;
  console.log("data recieved" + bio, experience, education, skills);
  console.log("Received experience data:", experience);

  console.log("Saving data for user:", user_id);

  // Validate bio
  if (bio && (typeof bio !== "string" || bio.length > 1000)) {
    return res.status(400).json({ message: "Invalid bio." });
  }

  // // Validate experience
  // if (experience && !Array.isArray(experience)) {
  //   return res.status(400).json({ message: "Invalid experience data." });
  // }
  //
  // Validate education
  if (education && !Array.isArray(education)) {
    return res.status(400).json({ message: "Invalid education data." });
  }

  // Validate skills
  if (skills && !Array.isArray(skills)) {
    return res.status(400).json({ message: "Invalid skills data." });
  }

  // Check if at least one field is provided
  if (
    !bio &&
    (!experience || experience.length === 0) &&
    (!education || education.length === 0) &&
    (!skills || skills.length === 0)
  ) {
    return res.status(400).json({
      message:
        "At least one field (bio, experience, education, or skills) must be provided.",
    });
  }

  try {
    const updateFields = {};

    if (bio) updateFields.bio = bio;
    if (experience) updateFields.experienceDetails = experience;
    if (education) updateFields.educationDetails = education;
    if (skills) updateFields.skills = skills;

    const user = await User.findByIdAndUpdate(user_id, updateFields, {
      new: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Data updated successfully", user });
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to handle input form data
exports.InputFormData = async (req, res) => {
  console.log("formdata", req.body);
  const {
    fullName,
    headline,
    mobileNumber,
    twitter,
    linkedin,
    country,
    state,
    town,
    languages,
    user_id,
  } = req.body; // Destructure the formState from req.body
  // Assuming you're getting user_id from the request payload

  if (typeof fullName !== "string" || fullName.length > 100) {
    return res.status(400).json({ message: "Invalid full name." });
  }

  if (mobileNumber && typeof mobileNumber !== "string") {
    return res.status(400).json({ message: "Invalid mobile number." });
  }

  if (twitter && typeof twitter !== "string") {
    return res.status(400).json({ message: "Invalid Twitter handle." });
  }

  if (linkedin && typeof linkedin !== "string") {
    return res.status(400).json({ message: "Invalid LinkedIn profile." });
  }

  if (country && typeof country !== "string") {
    return res.status(400).json({ message: "Invalid country." });
  }

  if (state && typeof state !== "string") {
    return res.status(400).json({ message: "Invalid state." });
  }

  if (town && typeof town !== "string") {
    return res.status(400).json({ message: "Invalid town." });
  }

  if (languages && !Array.isArray(languages)) {
    return res.status(400).json({ message: "Invalid languages." });
  }

  try {
    // Update the user in the database, assuming you want to update these fields
    const updateFields = {
      fullName,
      headline,
      mobileNumber,
      twitter,
      linkedin,
      country,
      state,
      town,
      languagesKnown: languages,
    };

    const user = await User.findByIdAndUpdate(user_id, updateFields, {
      new: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Data saved successfully", user });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// exports.inputEntryData = async (req, res) => {
//   console.log(req.body)
//   const { username, headline, skills, interests, selectedCategory ,role_level,mentor_expertise } = req.body; // Added selectedCategory
//   const { user_id } = req.payload;

//   console.log("Received data:", req.body);

//   console.log("Saving data for user:", user_id);

//   try {
//     const updateFields = {};

//     if (username) {updateFields.userName = username}; // Changed from username to userName in the model
//     if (headline) {updateFields.headline = headline}; // Ensure headline is mapped correctly
//     if (skills) {updateFields.skills = skills}; // Ensure skills is mapped correctly
//     if (interests) {updateFields.interests = interests}; // Ensure interests is mapped correctly
//     if (selectedCategory) {updateFields.role = selectedCategory}; // Map selectedCategory to role_type

//      // Set isProfileComplete to true if any updates are made
//     updateFields.isProfileComplete = true;

//     const user = await User.findByIdAndUpdate(user_id, updateFields, { new: true });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({ message: "Data updated successfully", user });
//   } catch (error) {
//     console.error("Error updating data:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

exports.inputEntryData = async (req, res) => {
  try {
    const {
      username,
      headline,
      interests,
      selectedCategory,
      role_level,
      companyStage,
      mentorExpertise,
      experienceYears,
      linkedinProfile,
      verified,
    } = req.body;

    const { user_id } = req.payload;
    const updateFields = {};

    if (username) updateFields.userName = username;
    if (headline) updateFields.headline = headline;
    if (interests?.length) updateFields.interests = interests;
    if (selectedCategory) updateFields.role = selectedCategory;
    if (role_level) updateFields.role_level = role_level;
    if (companyStage) updateFields.companyStage = companyStage;

    if (experienceYears !== undefined) updateFields.experienceYears = experienceYears;
    if (linkedinProfile) updateFields.linkedinProfile = linkedinProfile;
    if (verified !== undefined) updateFields.verified = verified;

    /* ---------------- INDIVIDUAL / ENTREPRENEUR ---------------- */
    if (
      selectedCategory === "Individual/Entrepreneur" &&
      mentorExpertise &&
      typeof mentorExpertise === "object"
    ) {
      updateFields.skills = [
        ...new Set(Object.values(mentorExpertise).flat().filter(Boolean)),
      ];
      updateFields.mentorExpertise = Object.entries(mentorExpertise)
        .map(([industry, skills]) => ({
          industry,
          skills,
        }))
        .filter((item) => item.skills.length > 0);
    }

    /* ---------------- MENTOR ONLY ---------------- */
    if (
      selectedCategory === "Mentor" &&
      mentorExpertise &&
      typeof mentorExpertise === "object"
    ) {
      updateFields.mentorExpertise = Object.entries(mentorExpertise)
        .map(([industry, skills]) => ({
          industry,
          skills,
        }))
        .filter((item) => item.skills.length > 0);
      updateFields.skills = [];
    }

    updateFields.isProfileComplete = true;

    // Update the user
    const user = await User.findByIdAndUpdate(
      user_id,
      { $set: updateFields },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    /* ----------------------------------------------------------- */
    /* ✅ EMAIL LOGIC ADDED BELOW                                  */
    /* ----------------------------------------------------------- */
    if (user.email) {
      let subject = "";
      let htmlContent = "";
      const verificationLink = "https://forms.gle/hDEe8khij9rfatNz7";

      // 1. Template for FOUNDER (Individual/Entrepreneur)
      if (selectedCategory === "Individual/Entrepreneur") {
        subject = "Verification is Live - Free for Early Users";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <p>Hi ${user.userName || "there"},</p>
            <p>We’ve introduced Verification on Bloomr — built to recognise people who are actively building and engaging, not just listing ideas.</p>
            <p>Bloomr Verification helps you stand out as a serious operator and unlocks better access across the ecosystem.</p>
            
            <p><strong>As a Verified Founder, you get:</strong></p>
            <ul>
              <li>Higher visibility across discussions and founder feeds</li>
              <li>Priority discovery by mentors browsing founders to support</li>
              <li>Verified Founder badge that signals credibility and intent</li>
              <li>Stronger peer trust, leading to better-quality feedback and conversations</li>
              <li>Exclusive access to new features and experiments</li>
              <li>Higher signal presence as Bloomr evolves mentor matching and introductions</li>
            </ul>

            <p>Founder verification carries a one-time fee of ₹199.</p>
            <p><strong>However, for early Bloomr users, Verification is completely free!</strong></p>

            <p><a href="${verificationLink}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Click here to get verified</a></p>
            
            <p>If you’re actively building and want your profile to reflect that seriousness, get verified today!</p>
            
            <p>See you inside,<br>Team Bloomr</p>
          </div>
        `;
      } 
      
      // 2. Template for MENTOR
      else if (selectedCategory === "Mentor") {
        subject = "Mentor Verification is Live - Free for Early Users";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <p>Hi ${user.userName || "there"},</p>
            <p>We’re introducing Mentor Verification on Bloomr — to help founders identify and engage with mentors who bring real experience, intent, and commitment to the ecosystem.</p>
            <p>Mentor Verification is designed to increase signal, not noise.</p>

            <p><strong>As a Verified Mentor, you receive:</strong></p>
            <ul>
              <li>Priority visibility to founders actively seeking guidance</li>
              <li>Verified Mentor badge that signals credibility and experience</li>
              <li>Higher-quality inbound requests from serious founders</li>
              <li>Early access to mentor-specific features and experiments</li>
              <li>Influence on the ecosystem, including feedback on how Bloomr shapes founder–mentor interactions</li>
              <li>Reduced noise, as verified status helps founders approach you with clearer intent</li>
            </ul>

            <p>Mentor verification is a one-time fee of ₹1999.</p>
            <p><strong>However, as an early mentor on Bloomr, verification is completely free for you!</strong></p>

            <p><a href="${verificationLink}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Click here to get verified</a></p>
            
            <p>If you’re interested in guiding early-stage founders and want your profile to reflect that commitment, you can apply for verification today!</p>
            
            <p>Looking forward to building this ecosystem together,<br>Team Bloomr<br>bloomr.world</p>
          </div>
        `;
      }

      // Send the email if a template matched
      if (subject && htmlContent) {
        try {
          await send_Notification_mail({
            email: user.email,
            subject: subject,
            html: htmlContent, // or text, depending on your sendEmail implementation
          });
          console.log(`Verification email sent to ${user.email} as ${selectedCategory}`);
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
          // We do not return an error response here so the user update remains successful
        }
      }
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating entry data:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
// GET users based on verified status
exports.getUsersByVerifiedStatusByAdmin = async (req, res) => {
  try {
    const { status } = req.params;
    // Convert string to boolean
    const isVerified = status === "true";

    const users = await User.find({
      verified: isVerified,
      beyincProfile: { $ne: "" }, // Only get users where beyincProfile is not empty
    });

    return res.status(200).json({
      message: "Users retrieved successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users by verified status:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// UPDATE user's verified status
exports.updateVerifiedStatusByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { verified } = req.body;

    if (typeof verified !== "boolean") {
      return res
        .status(400)
        .json({ message: "Verified must be a boolean value" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { verified } },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Verified status updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating verified status:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.startupEntryData = async (req, res) => {
  try {
    const {
      startupName,
      startupTagline,
      founderName,
      startupEmail,
      visibilityMode,
      startupStage,
      startupTeamSize,
      industries,
      targetMarket,
    } = req.body;

    // FIX: Safety check to get user_id from payload (middleware) OR body (frontend)
    // This prevents the "Cannot destructure property of undefined" crash.
    const user_id = req.payload?.user_id || req.body.user_id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    console.log("Received startup data:", req.body);
    console.log("Saving startup data for user:", user_id);

    // 🔹 Base update fields (role enforcement)
    const updateFields = {
      role: "Startup",
      categoryUserRole: "Startup",
      interests: ["Startup"],
      isProfileComplete: true,
      userName: startupName // Updating main username to Startup Name
    };

    // 🔹 PATCH-style nested updates
    if (startupName) updateFields["startupProfile.startupName"] = startupName;
    if (startupTagline) updateFields["startupProfile.startupTagline"] = startupTagline;
    if (founderName) updateFields["startupProfile.founderName"] = founderName;
    if (startupEmail) updateFields["startupProfile.startupEmail"] = startupEmail;
    if (visibilityMode) updateFields["startupProfile.visibilityMode"] = visibilityMode;
    if (startupStage) updateFields["startupProfile.stage"] = startupStage;
    if (startupTeamSize) updateFields["startupProfile.teamSize"] = startupTeamSize;
    if (industries && Array.isArray(industries) && industries.length > 0)
      updateFields["startupProfile.industries"] = industries;
    if (targetMarket) updateFields["startupProfile.targetMarket"] = targetMarket;

    // 🔹 Guard: prevent empty startup updates
    // We check if only the 5 base fields exist (meaning no startup info was sent)
    if (Object.keys(updateFields).length === 5) {
      return res.status(400).json({
        message: "No startup data provided to update",
      });
    }

    // 🔹 Update Database
    const user = await User.findByIdAndUpdate(
      user_id,
      { $set: updateFields },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ---------------------------------------------------------
    // 🔹 EMAIL NOTIFICATION LOGIC
    // ---------------------------------------------------------
    // Wrapped in try/catch so email failure does not crash the API response
    try {
      // Prioritize the user's account email, fallback to the startup contact email
      const emailRecipient = user.email || startupEmail;
      
      if (emailRecipient) {
        // Use the founderName from req.body or fetch from the updated user object
        const recipientName = founderName || user.startupProfile?.founderName || "Founder";
        
        const htmlContent = getStartupVerificationTemplate(recipientName);
        const subject = "Startup Verification is Live - Free for Early Users";

        await send_Notification_mail(emailRecipient, subject, htmlContent);
        console.log(`Startup verification email sent to ${emailRecipient}`);
      }
    } catch (emailError) {
      // Log error but continue
      console.error("Failed to send startup verification email:", emailError);
    }
    // ---------------------------------------------------------

    return res.status(200).json({
      message: "Startup profile updated successfully",
      user,
    });

  } catch (error) {
    console.error("Error updating startup profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.updateBeyincProfile = async (req, res) => {
  try {
    const { beyincProfile } = req.body;
    const { user_id } = req.payload;

    // Validate input - check if beyincProfile exists in body (even if empty string)
    if (beyincProfile === undefined) {
      return res.status(400).json({
        message: "beyincProfile value is required",
      });
    }

    console.log(
      `Updating beyincProfile for user ${user_id} to: ${beyincProfile}`,
    );

    // Update only the beyincProfile field
    const user = await User.findByIdAndUpdate(
      user_id,
      { $set: { beyincProfile } },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "beyincProfile updated successfully",
      beyincProfile: user.beyincProfile,
    });
  } catch (error) {
    console.error("Error updating beyincProfile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Add BOTH functions to your userProfileController.js

// GET seeking options
exports.getSeekingOptions = async (req, res) => {
  try {
    const { id, user_id } = req.body;
    const targetUserId = id || user_id;

    console.log("Fetching seeking options for user:", targetUserId);

    const user = await User.findById(targetUserId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      seekingOptions: user.seekingOptions || [],
    });
  } catch (error) {
    console.error("Error fetching seeking options:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// SAVE seeking options
exports.saveSeekingOptions = async (req, res) => {
  try {
    const { seekingOptions } = req.body;
    const { user_id } = req.payload;

    console.log("Received seeking options:", seekingOptions);
    console.log("Saving seeking options for user:", user_id);

    // Validate that seekingOptions is an array
    if (!Array.isArray(seekingOptions)) {
      return res.status(400).json({
        message: "seekingOptions must be an array",
      });
    }

    // Update fields
    const updateFields = {
      seekingOptions: seekingOptions,
    };

    const user = await User.findByIdAndUpdate(
      user_id,
      { $set: updateFields },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Seeking options updated successfully",
      seekingOptions: user.seekingOptions,
    });
  } catch (error) {
    console.error("Error updating seeking options:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//fetch startup data

exports.getStartupProfileData = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "startupProfile.industries startupProfile.targetMarket startupProfile.stage",
    );

    if (!user || !user.startupProfile) {
      return res.status(404).json({
        success: false,
        message: "Startup profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        industries: (user.startupProfile.industries || []).filter(Boolean),
        targetMarket: user.startupProfile.targetMarket || "",
        stage: user.startupProfile.stage || "",
      },
    });
  } catch (error) {
    console.error("getStartupProfileData error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.SaveDocuments = async (req, res, next) => {
  try {
    const { resume, achievements, degree, expertise, working, userId } =
      req.body;
    console.log("Request Body:", req.body);

    const user = await User.findById(userId);
    if (!user) return res.status(400).send("User not found");

    let uploadedDocuments = {};

    // Handle document uploads with condition checks
    const uploadDocument = async (document, key) => {
      if (document) {
        // Delete existing document if it exists
        if (user.documents[key]?.public_id) {
          await cloudinary.uploader.destroy(user.documents[key].public_id);
        }
        // Upload new document and store the result
        const uploadedDoc = await cloudinary.uploader.upload(document, {
          folder: `${user.email}/documents`,
        });
        uploadedDocuments[key] = {
          public_id: uploadedDoc.public_id,
          secure_url: uploadedDoc.secure_url,
        };
      }
    };

    // Execute uploads
    await uploadDocument(resume, "resume");
    await uploadDocument(expertise, "expertise");
    await uploadDocument(achievements, "achievements");
    await uploadDocument(degree, "degree");
    await uploadDocument(working, "working");

    // Update user with uploaded document details
    await User.updateOne(
      { _id: userId },
      {
        $set: { documents: { ...user.documents, ...uploadedDocuments } },
      },
    );

    return res.send({ message: "Documents uploaded successfully" });
  } catch (err) {
    console.error("Error details:", err.message);
    console.error("Error stack:", err.stack);
    return res
      .status(400)
      .json({ error: "Error while saving documents", details: err.message });
  }
};

exports.SaveDocument = async (req, res, next) => {
  try {
    const { resume, userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(400).send("User not found");

    let uploadedDocuments = {};

    // Handle document uploads with condition checks
    const uploadDocument = async (document, key) => {
      if (document) {
        // Delete existing document if it exists
        if (user.documents[key]?.public_id) {
          await cloudinary.uploader.destroy(user.documents[key].public_id);
        }
        // Upload new document and store the result
        const uploadedDoc = await cloudinary.uploader.upload(document, {
          folder: `${user.email}/document`,
        });
        uploadedDocuments[key] = {
          public_id: uploadedDoc.public_id,
          secure_url: uploadedDoc.secure_url,
        };
      }
    };

    // Execute uploads
    await uploadDocument(resume, "resume");

    // Update user with uploaded document details
    await User.updateOne(
      { _id: userId },
      {
        $set: { documents: { ...user.documents, ...uploadedDocuments } },
      },
    );

    return res.send({ message: "Documents uploaded successfully" });
  } catch (err) {
    console.error("Error details:", err.message);
    console.error("Error stack:", err.stack);
    return res
      .status(400)
      .json({ error: "Error while saving documents", details: err.message });
  }
};

// Controller to save the education details of the user in an array

exports.SaveEducationDetails = async (req, res, next) => {
  try {
    const { education } = req.body;
    const { user_id } = req.payload;

    if (!user_id) return res.status(400).send("userId must be provided");

    // Ensure education details are provided
    if (!education || !Array.isArray(education) || education.length === 0) {
      return res.status(400).send("Education details must be provided.");
    }

    // Find the user by userId
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).send("User not found");
    }

    // Ensure educationDetails is initialized as an array if not present
    if (!Array.isArray(user.educationDetails)) {
      user.educationDetails = [];
    }

    // Validate and add education entries
    for (let entry of education) {
      const { Edstart, Edend, grade, college } = entry;

      // Validate Edstart
      if (!Edstart || typeof Edstart !== "string") {
        return res.status(400).send("Invalid Edstart date format.");
      }

      // Validate Edend
      if (!Edend || typeof Edend !== "string") {
        return res.status(400).send("Invalid Edend date format.");
      }

      const startDate = new Date(Edstart);
      const endDate = new Date(Edend);
      if (endDate < startDate) {
        return res.status(400).send("'Edend' date must be after 'Edstart'.");
      }

      // Validate college name
      if (!college || typeof college !== "string" || college.trim() === "") {
        return res.status(400).send("College name cannot be empty.");
      }

      // Push the valid education entry to the user's educationDetails array
      user.educationDetails.push(entry);
    }

    // Save the updated user document
    await user.save();

    // Return success message and updated education details
    return res.status(200).json({
      educationDetails: user.educationDetails, // Send updated education details
      message: "Education details saved successfully.",
    });
  } catch (err) {
    console.error("Error in SaveEducation: ", err);
    return res.status(500).send("Internal Server Error");
  }
};

// Controller to delete the education Details of the user from an array

exports.DeleteEducationDetails = async (req, res, next) => {
  try {
    const { _id } = req.body;
    const { user_id } = req.payload;

    if (!_id || !user_id) {
      return res
        .status(400)
        .send({ message: "Both userId and education _id must be provided." });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    const educationIndex = user.educationDetails.findIndex(
      (entry) => entry._id.toString() === _id,
      // (entry) => entry._id.toString() === _id,
    );

    if (educationIndex === -1) {
      return res.status(400).send({ message: "Education entry not found" });
    }

    user.educationDetails.splice(educationIndex, 1);

    await user.save();

    return res.status(200).send({
      success: true,
      message: "Education details deleted successfully.",
      educationDetails: user.educationDetails,
    });
  } catch (err) {
    console.error("Error in DeleteEducationDetails: ", err);
    return res.status(500).send("Internal Server Error");
  }
};

// Controller to save experience details

exports.SaveExperienceDetails = async (req, res, next) => {
  try {
    const { experience } = req.body;
    const { user_id } = req.payload;
    console.log("This is the user_id from the middleware: ", user_id);

    if (!experience || !Array.isArray(experience) || experience.length === 0) {
      return res
        .status(400)
        .send({ message: "Experience details must be provided." });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    if (!Array.isArray(user.experienceDetails)) {
      user.experienceDetails = [];
    }

    for (let entry of experience) {
      const {
        startYear,
        endYear,
        company,
        designation,
        Description,
        CompanyLocation,
        Banner,
        Logo,
      } = entry;

      if (startYear && typeof startYear !== "string") {
        return res.status(400).send({ message: "Invalid startYear format" });
      }
      if (endYear && typeof endYear !== "string") {
        return res.status(400).send({ message: "Invalid endYear format" });
      }

      if (!company || typeof company !== "string" || company.trim() === "") {
        return res
          .status(400)
          .send({ message: "Company name cannot be empty" });
      }

      if (designation && typeof designation !== "string") {
        return res.status(400).send({ message: "Invalid designation format" });
      }

      if (Description && typeof Description !== "string") {
        return res.status(400).send({ message: "Invalid Description format" });
      }

      if (CompanyLocation && typeof CompanyLocation !== "string") {
        return res
          .status(400)
          .send({ message: "Invalid CompanyLocation format" });
      }

      if (
        Banner &&
        Banner.secure_url &&
        typeof Banner.secure_url !== "string"
      ) {
        return res
          .status(400)
          .send({ message: "Invalid Banner secure_url format" });
      }

      if (Logo && Logo.secure_url && typeof Logo.secure_url !== "string") {
        return res
          .status(400)
          .send({ message: "Invalid Logo secure_url format" });
      }

      user.experienceDetails.push(entry);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Experience details saved successfully.",
      experienceDetails: user.experienceDetails,
    });
  } catch (err) {
    console.error("Error in SaveExperienceDetails: ", err);
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Controller to delete Experience Details

exports.DeleteExperienceDetails = async (req, res, next) => {
  try {
    const { _id } = req.body;
    const { user_id } = req.payload;

    if (!_id) {
      return res
        .status(400)
        .send({ message: "experience _id must be provided." });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    const experienceIndex = user.experienceDetails.findIndex(
      (entry) => entry._id.toString() === _id,
      // (entry) => entry._id.toString() === _id,
    );

    if (experienceIndex === -1) {
      return res.status(400).send({ message: "Experience entry not found" });
    }

    user.experienceDetails.splice(experienceIndex, 1);

    await user.save();

    return res.status(200).send({
      success: true,
      message: "Experience details deleted successfully.",
      experienceDetails: user.experienceDetails,
    });
  } catch (err) {
    console.error("Error in DeleteExperienceDetails: ", err);
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Controller to get Experience Details

exports.GetExperienceDetails = async (req, res, next) => {
  try {
    const { user_id } = req.payload;
    const { id } = req.body;
    if (!id && !user_id) {
      return res.status(400).send({ message: "User ID is required." });
    }

    let user;
    if (id) {
      // If id is provided, search by id
      user = await User.findById(id);
    } else {
      // Otherwise, search by user_id
      user = await User.findById(user_id);
    }
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      experienceDetails: user.experienceDetails || [],
    });
  } catch (err) {
    console.error("Error in GetExperienceDetails: ", err);
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Controller to get Education Details
// Controller to get Education Details
exports.GetEducationDetails = async (req, res, next) => {
  try {
    const { id } = req.body; // Extract id from the request body
    const { user_id } = req.payload; // Extract user_id from the payload

    console.log("Extracted user_id:", user_id);
    console.log("Extracted id:", id);

    if (!id && !user_id) {
      return res.status(400).send({ message: "User ID or ID is required." });
    }

    let user;
    if (id) {
      // If id is provided, search by id
      user = await User.findById(id);
    } else {
      // Otherwise, search by user_id
      user = await User.findById(user_id);
    }

    console.log("Fetched user:", user);

    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      educationDetails: user.educationDetails || [],
    });
  } catch (err) {
    console.error("Error in GetEducationDetails:", err);
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Controller to UpdateEducation Details

exports.UpdateEducationDetails = async (req, res, next) => {
  try {
    const education = req.body.payload;
    console.log("This is the education: ", education);
    const { user_id } = req.payload;

    if (!user_id) {
      return res.status(400).send({ message: "User ID is required." });
    }
    if (!education || !education._id) {
      return res
        .status(400)
        .send({ message: "Education details with _id are required." });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    const educationIndex = user.educationDetails.findIndex(
      (entry) => entry._id.toString() === education._id,
      // (entry) => entry._id.toString() === education._id,
    );
    if (educationIndex === -1) {
      return res.status(400).send({ message: "Education entry not found" });
    }

    console.log(
      "Updated Education Object: ",
      user.educationDetails[educationIndex],
      // user.educationDetails[educationIndex],
    );

    // Explicitly update fields to ensure they are saved
    user.educationDetails[educationIndex].Edstart = education.Edstart;
    user.educationDetails[educationIndex].Edend = education.Edend;
    user.educationDetails[educationIndex].grade = education.grade;
    user.educationDetails[educationIndex].college = education.college;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Education details updated successfully.",
      educationDetails: user.educationDetails,
    });
  } catch (err) {
    console.error("Error in UpdateEducationDetails: ", err);
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Controller to update Experience Details
exports.UpdateExperienceDetails = async (req, res, next) => {
  try {
    const { experience } = req.body;
    const { user_id } = req.payload;

    if (!user_id) {
      return res.status(400).send({ message: "User ID is required." });
    }
    if (!experience || !experience._id) {
      return res
        .status(400)
        .send({ message: "Experience details with _id are required." });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    const experienceIndex = user.experienceDetails.findIndex(
      (entry) => entry._id.toString() === experience._id,
      // (entry) => entry._id.toString() === experience._id,
    );

    if (experienceIndex === -1) {
      return res.status(400).send({ message: "Experience entry not found" });
    }

    user.experienceDetails[experienceIndex] = {
      ...user.experienceDetails[experienceIndex],
      ...experience,
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Experience details updated successfully.",
      experienceDetails: user.experienceDetails,
    });
  } catch (err) {
    console.error("Error in UpdateExperienceDetails: ", err);
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Controller to create about

exports.uploadResume = async (req, res, next) => {
  try {
    const { resume, user_id } = req.body;
    console.log("Request Body:", req.body);

    //   const user = await User.findById(user_id);
    //   if (!user) return res.status(400).send("User not found");

    //   let uploadedDocuments = {};

    //   // Handle document uploads with condition checks
    //   const uploadDocument = async (document, key) => {
    //     if (document) {
    //       // Delete existing document if it exists
    //       if (user.documents[key]?.public_id) {
    //         await cloudinary.uploader.destroy(user.documents[key].public_id);
    //       }
    //       // Upload new document and store the result
    //       const uploadedDoc = await cloudinary.uploader.upload(document, {
    //         folder: `${user.email}/documents`,
    //       });
    //       uploadedDocuments[key] = {
    //         public_id: uploadedDoc.public_id,
    //         secure_url: uploadedDoc.secure_url,
    //       };
    //     }
    //   };

    //   // Execute uploads
    //   await uploadDocument(resume, "resume");

    //   // Update user with uploaded document details
    //   await User.updateOne(
    //     { _id: user_id },
    //     {
    //       $set: { documents: { ...user.documents, ...uploadedDocuments } },
    //     }
    //   );

    //   return res.send({ message: "Documents uploaded successfully" });
  } catch (err) {
    console.error("Error details:", err.message);
    console.error("Error stack:", err.stack);
    return res
      .status(400)
      .json({ error: "Error while saving documents", details: err.message });
  }
};

exports.CreateAbout = async (req, res, next) => {
  try {
    const { about } = req.body;
    const { user_id } = req.payload;

    if (!user_id) {
      return res.status(400).send({ message: "User ID is required." });
    }

    if (typeof about !== "string" || about.trim() === "") {
      return res.status(400).send({
        message: "About field is required and must be a non-empty string.",
      });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    user.about = about;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "About field updated successfully.",
      about: user.about,
    });
  } catch (err) {
    // Better error logging
    console.error("Error message:", err.message);
    if (err.errors) {
      console.error("Validation errors:", err.errors);
    }

    return res.status(500).send({
      success: false,
      message: err.message || "Internal Server Error",
      // Include validation errors if they exist
      errors: err.errors
        ? Object.keys(err.errors).map((key) => ({
            field: key,
            message: err.errors[key].message,
          }))
        : undefined,
    });
  }
};

// Controller to read about

exports.ReadAbout = async (req, res, next) => {
  try {
    const { id } = req.body;
    const { user_id } = req.payload;

    // console.log("Extracted payload:", req.payload);
    // console.log("Extracted user_id:", user_id);
    // console.log("Extracted id:", id);

    // Validate if at least one identifier is provided
    if (!user_id && !id) {
      return res.status(400).send({ message: "UserId or ID is required" });
    }

    // Find user by either user_id or id
    const user = await User.findById(id ? id : user_id);
    // console.log('Fetched user:', user);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    return res.status(200).json({
      about: user.about,
      message: "About fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching the about section:", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Controller to Add skills

exports.AddSkills = async (req, res, next) => {
  try {
    const { skills } = req.body;
    const { user_id } = req.payload;

    if (!user_id) {
      return res.status(400).send({ message: "UserId required" });
    }
    if (!skills || skills.length === 0) {
      return res.status(400).send({ message: "Skills Array is empty" });
    }
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    user.skills = [...new Set([...user.skills, ...skills])]; // This ensures that there are no duplicates
    await user.save();

    return res.status(200).json({
      message: "Skills added successfully",
      skills: user.skills,
    });
  } catch (error) {
    console.log("Error Adding Skills: ", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Controller to Delete skills

exports.DeleteSkill = async (req, res, next) => {
  try {
    const { skillsToDelete } = req.body;
    const { user_id } = req.payload;
    if (!user_id) {
      return res.status(400).send({ message: "UserId required" });
    }
    if (!skillsToDelete || skillsToDelete.length === 0) {
      return res.status(400).send({ message: "Skills Array is empty" });
    }
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    user.skills = user.skills.filter(
      (skill) => !skillsToDelete.includes(skill),
      // (skill) => !skillsToDelete.includes(skill),
    );

    await user.save();

    return res
      .status(200)
      .send({ message: "Skills deleted successfully", skills: user.skills });
  } catch (error) {
    console.log("There was an error while deleting skills", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
// Controller to get Skills

exports.ReadSkills = async (req, res, next) => {
  try {
    console.log("read skills", req.body);
    const { id } = req.body;
    const { user_id } = req.payload;

    const user = await User.findById(id ? id : user_id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Skills fetched successfully",
      skills: user.skills,
    });
  } catch (error) {
    console.log("There was an error while fetchind skills: ", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

exports.getNewProfiles = async (req, res, next) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const loggedInUserId = new mongoose.Types.ObjectId(req.payload.user_id);

    const users = await User.aggregate([
      {
        $match: {
          email: { $ne: req.payload.email },
          isProfileComplete: true,
          followers: { $nin: [loggedInUserId] },
          _id: { $ne: loggedInUserId },
        },
      },
    ]);

    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.sendCoFounderInvite = async (req, res) => {
  try {
    const { email, name, role, startupName } = req.body;
    const { user_id } = req.payload; 

    if (!email || !name) {
      return res.status(400).json({ message: "Co-founder Name and Email are required" });
    }

    const currentUser = await User.findById(user_id);
    const alreadyExists = currentUser.startupProfile?.cofounders.find(
      (member) => member.email.toLowerCase() === email.toLowerCase()
    );

    if (alreadyExists && alreadyExists.status === 'verified') {
      return res.status(400).json({ message: "This user is already a verified team member." });
    }

    if (!alreadyExists) {
      await User.findByIdAndUpdate(user_id, {
        $push: {
          "startupProfile.cofounders": {
            name: name,
            email: email,
            position: role || "Co-Founder", 
            status: "pending",   
            verified: false,     
            profileImage: "",   
            addedAt: new Date()
          }
        }
      });
    }

    const founderName = currentUser.userName || "A Founder";
    const actualStartupName = startupName || "their startup";
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await userVerify.findOneAndUpdate(
      { email: email },
      { verifyToken: otp },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 4. Send Email
    const emailSubject = `Invitation to join ${actualStartupName} as Co-Founder`;
    await send_Notification_mail(email, emailSubject, `Your verification code is: ${otp}`);
    
    console.log(`[DEV] OTP for ${email}: ${otp}`);

    res.status(200).json({ message: "Invite sent and member added as pending." });

  } catch (error) {
    console.error("Error sending invite:", error);
    res.status(500).json({ message: "Server error while sending invite." });
  }
};

// 2. Verify OTP and Add to Startup Profile
exports.verifyAndAddCoFounder = async (req, res) => {
  try {
    const { email, otp } = req.body; // We only strictly need email & otp now
    const { user_id } = req.payload;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const validOtp = await userVerify.findOne({ email: email, verifyToken: otp });
    if (!validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const updatedUser = await User.findOneAndUpdate(
      { 
        _id: user_id, 
        "startupProfile.cofounders.email": email 
      },
      {
        $set: {
          "startupProfile.cofounders.$.status": "verified", 
          "startupProfile.cofounders.$.verified": true,     
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Founder or pending team member not found." });
    }

    // 3. Clean up OTP
    await userVerify.deleteOne({ _id: validOtp._id });

    // 4. Return updated list
    res.status(200).json({ 
      message: "Co-founder successfully verified!", 
      cofounders: updatedUser.startupProfile.cofounders 
    });

  } catch (error) {
    console.error("Error verifying co-founder:", error);
    res.status(500).json({ message: "Server error during verification." });
  }
};

exports.getFoundingTeam = async (req, res) => {
  try {
    const { user_id } = req.payload;

    // Fetch the user with their startup profile
    const currentUser = await User.findById(user_id).select('startupProfile.cofounders');

    if (!currentUser || !currentUser.startupProfile) {
      return res.status(404).json({ message: "Startup profile not found." });
    }

    // Return the cofounders array
    const cofounders = currentUser.startupProfile.cofounders || [];

    res.status(200).json({ 
      success: true,
      cofounders: cofounders 
    });

  } catch (error) {
    console.error("Error fetching founding team:", error);
    res.status(500).json({ message: "Server error while fetching team." });
  }
};