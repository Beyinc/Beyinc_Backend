const User = require("../models/UserModel");
const cloudinary = require("../helpers/UploadImage");
const { default: mongoose } = require("mongoose");

// Save User Data Function
exports.saveData = async (req, res) => {
  const { bio, experience, education, skills, user_id } = req.body;
  console.log("data recieved"+ bio, experience, education, skills);
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

  // Validate education
  if (education && !Array.isArray(education)) {
    return res.status(400).json({ message: "Invalid education data." });
  }

  // Validate skills
  if (skills && !Array.isArray(skills)) {
    return res.status(400).json({ message: "Invalid skills data." });
  }

  // Check if at least one field is provided
  if (!bio && (!experience || experience.length === 0) && (!education || education.length === 0) && (!skills || skills.length === 0)) {
    return res.status(400).json({ message: "At least one field (bio, experience, education, or skills) must be provided." });
  }

  try {
    const updateFields = {};
    
    if (bio) updateFields.bio = bio;
    if (experience) updateFields.experienceDetails = experience;
    if (education) updateFields.educationDetails = education;
    if (skills) updateFields.skills = skills;

    const user = await User.findByIdAndUpdate(user_id, updateFields, { new: true });

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
  console.log("formdata",req.body);
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
    user_id
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
      languagesKnown:languages,
    };

    const user = await User.findByIdAndUpdate(user_id, updateFields, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Data saved successfully", user });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.inputEntryData = async (req, res) => {
  console.log(req.body)
  const { username, headline, skills, interests, selectedCategory } = req.body; // Added selectedCategory
  const { user_id } = req.payload;

  console.log("Saving data for user:", user_id);

  try {
    const updateFields = {};

    if (username) {updateFields.userName = username}; // Changed from username to userName in the model
    if (headline) {updateFields.headline = headline}; // Ensure headline is mapped correctly
    if (skills) {updateFields.skills = skills}; // Ensure skills is mapped correctly
    if (interests) {updateFields.interests = interests}; // Ensure interests is mapped correctly
    if (selectedCategory) {updateFields.role = selectedCategory}; // Map selectedCategory to role_type

     // Set isProfileComplete to true if any updates are made
    updateFields.isProfileComplete = true;
    
    const user = await User.findByIdAndUpdate(user_id, updateFields, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Data updated successfully", user });
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.SaveDocuments = async (req, res, next) => {
  try {
    const { resume, achievements, degree, expertise, working, userId } = req.body;
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
      }
    );

    return res.send({ message: "Documents uploaded successfully" });
  } catch (err) {
    console.error("Error details:", err.message);
    console.error("Error stack:", err.stack);
    return res.status(400).json({ error: "Error while saving documents", details: err.message });
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
      }
    );

    return res.send({ message: "Documents uploaded successfully" });
  } catch (err) {
    console.error("Error details:", err.message);
    console.error("Error stack:", err.stack);
    return res.status(400).json({ error: "Error while saving documents", details: err.message });
  }
};

// Controller to save the education details of the user in an array

exports.SaveEducationDetails = async (req, res, next) => {
  try {
    const { education } = req.body;
    const { user_id } = req.payload;

    if(!user_id) return res.status(400).send("userId must be provided");

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
      message: "Education details saved successfully."
    });

  } catch (err) {
    console.error("Error in SaveEducation: ", err);
    return res.status(500).send("Internal Server Error");
  }
};

// Controller to delete the education Details of the user from an array

exports.DeleteEducationDetails = async (req, res, next) => {
  try {
    const { _id, } = req.body;
    const { user_id } = req.payload;

    if (!_id || !user_id) {
      return res.status(400).send({ message: "Both userId and education _id must be provided." });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    const educationIndex = user.educationDetails.findIndex(entry => entry._id.toString() === _id);

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
      return res.status(400).send({ message: "Experience details must be provided." });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    if (!Array.isArray(user.experienceDetails)) {
      user.experienceDetails = [];
    }

    for (let entry of experience) {
      const { startYear, endYear, company, designation, Description, CompanyLocation, Banner, Logo } = entry;

      if (startYear && typeof startYear !== "string") {
        return res.status(400).send({ message: "Invalid startYear format" });
      }
      if (endYear && typeof endYear !== "string") {
        return res.status(400).send({ message: "Invalid endYear format" });
      }

      if (!company || typeof company !== "string" || company.trim() === "") {
        return res.status(400).send({ message: "Company name cannot be empty" });
      }

      if (designation && typeof designation !== "string") {
        return res.status(400).send({ message: "Invalid designation format" });
      }

      if (Description && typeof Description !== "string") {
        return res.status(400).send({ message: "Invalid Description format" });
      }

      if (CompanyLocation && typeof CompanyLocation !== "string") {
        return res.status(400).send({ message: "Invalid CompanyLocation format" });
      }

      if (Banner && Banner.secure_url && typeof Banner.secure_url !== "string") {
        return res.status(400).send({ message: "Invalid Banner secure_url format" });
      }

      if (Logo && Logo.secure_url && typeof Logo.secure_url !== "string") {
        return res.status(400).send({ message: "Invalid Logo secure_url format" });
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
      message: "Internal Server Error"
    });
  }
};

// Controller to delete Experience Details

exports.DeleteExperienceDetails = async (req, res, next) => {
  try {
    const { _id } = req.body;
    const { user_id } = req.payload;

    if (!_id ) {
      return res.status(400).send({ message: "experience _id must be provided." });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    const experienceIndex = user.experienceDetails.findIndex(entry => entry._id.toString() === _id);

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
      message: "Internal Server Error"
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
      message: "Internal Server Error"
    });
  }
};

// Controller to get Education Details
// Controller to get Education Details
exports.GetEducationDetails = async (req, res, next) => {
  try {
    const { id } = req.body; // Extract id from the request body
    const { user_id } = req.payload; // Extract user_id from the payload

    console.log('Extracted user_id:', user_id);
    console.log('Extracted id:', id);

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

    console.log('Fetched user:', user);

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
      return res.status(400).send({ message: "Education details with _id are required." });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    const educationIndex = user.educationDetails.findIndex(entry => entry._id.toString() === education._id);
    if (educationIndex === -1) {
      return res.status(400).send({ message: "Education entry not found" });
    }

    console.log("Updated Education Object: ", user.educationDetails[educationIndex]);


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
      message: "Internal Server Error"
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
      return res.status(400).send({ message: "Experience details with _id are required." });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    const experienceIndex = user.experienceDetails.findIndex(entry => entry._id.toString() === experience._id);

    if (experienceIndex === -1) {
      return res.status(400).send({ message: "Experience entry not found" });
    }

    user.experienceDetails[experienceIndex] = {
      ...user.experienceDetails[experienceIndex], 
      ...experience 
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
      message: "Internal Server Error"
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
    return res.status(400).json({ error: "Error while saving documents", details: err.message });
  }
};

exports.CreateAbout = async (req, res, next) => {
  try {
    const { about } = req.body;
    console.log("This is the payload: ", req.payload);
    const { user_id } = req.payload;

    if (!user_id) {
      return res.status(400).send({ message: "User ID is required." });
    }
    if (typeof about !== 'string' || about.trim() === "") {
      return res.status(400).send({ message: "About field is required and must be a non-empty string." });
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
      about: user.about
    });

  } catch (err) {
    console.error("Error in CreateAbout: ", err);
    return res.status(500).send({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// Controller to read about

exports.ReadAbout = async (req, res, next) => {
 

  try {
    const { id} = req.body;
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

exports.AddSkills = async(req, res, next) => {
  try{
    const { skills } = req.body;
    const { user_id } = req.payload;

    if(!user_id) {
      return res.status(400).send({ message: "UserId required"})
    }
    if(!skills || skills.length === 0){
      return res.status(400).send({ message: "Skills Array is empty"})
    }
    const user = await User.findById(user_id);
    if(!user){
      return res.status(404).send({ message: "User not found"})
    }
    user.skills = [...new Set([...user.skills, ...skills])]; // This ensures that there are no duplicates
    await user.save();

    return res.status(200).json({
      message: "Skills added successfully",
      skills: user.skills
    })

  }catch(error){
    console.log("Error Adding Skills: ", error);
    res.status(500).json({
      message: "Internal Server Error"
    })
  }
}

// Controller to Delete skills

exports.DeleteSkill = async(req, res, next) => {
  try{
    const { skillsToDelete } = req.body;
    const { user_id } = req.payload;
    if(!user_id) {
      return res.status(400).send({ message: "UserId required"})
    }
    if(!skillsToDelete || skillsToDelete.length === 0){
      return res.status(400).send({ message: "Skills Array is empty"})
    }
    const user = await User.findById(user_id);
    if(!user){
      return res.status(404).send({ message: "User not found"})
    }

    user.skills = user.skills.filter(skill => !skillsToDelete.includes(skill))
    
    await user.save();

    return res.status(200).send({ message: "Skills deleted successfully", skills: user.skills });

  }catch(error){
    console.log("There was an error while deleting skills", error);
    res.status(500).send({ message: "Internal Server Error" })
  }

}
// Controller to get Skills

exports.ReadSkills = async(req, res, next) => {
  try{
    console.log('read skills',req.body)
    const { id} = req.body;
    const { user_id } =req.payload;
    
    const user = await User.findById(id ? id : user_id);
    if(!user){
      return res.status(404).send({ message: "User not found"})
    }
    
    return res.status(200).json({
      message: "Skills fetched successfully",
      skills: user.skills
    })
  }catch(error){
    console.log("There was an error while fetchind skills: ", error);
    res.status(500).send({ message: "Internal Server Error"})
  }
    
}

exports.getNewProfiles = async (req, res, next) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const loggedInUserId = new mongoose.Types.ObjectId(req.payload.user_id);

    const users = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: oneMonthAgo },
          email: { $ne: req.payload.email },
          followers: { $nin: [loggedInUserId] },
          _id: { $ne: loggedInUserId }
        }
      }
    ]);


    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};