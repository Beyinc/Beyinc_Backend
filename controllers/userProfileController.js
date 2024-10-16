const User = require("../models/UserModel");

// Save User Data Function
exports.saveData = async (req, res) => {
  const { bio, experience, education, skills } = req.body;
  const { user_id } = req.payload;
// console.log("data recieved"+ bio, experience, education, skills);
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
  const {
    salutation,
    fullName,
    mentorCategories,
    mobileNumber,
    twitter,
    linkedin,
    country,
    state,
    town,
    languages,
  } = req.body; // Destructure the formState from req.body

  const { user_id } = req.payload; // Assuming you're getting user_id from the request payload

  // Validate fields if necessary
  if (typeof salutation !== "string") {
    return res.status(400).json({ message: "Invalid salutation." });
  }

  if (typeof fullName !== "string" || fullName.length > 100) {
    return res.status(400).json({ message: "Invalid full name." });
  }

  if (mentorCategories && typeof mentorCategories !== "string") {
    return res.status(400).json({ message: "Invalid mentor categories." });
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
      salutation,
      fullName,
      mentorCategories,
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
  const { username, headline, skills, interests, selectedCategory } = req.body; // Added selectedCategory
  const { user_id } = req.payload;

  console.log("Saving data for user:", user_id);

  try {
    const updateFields = {};

    if (username) updateFields.userName = username; // Changed from username to userName in the model
    if (headline) updateFields.headline = headline; // Ensure headline is mapped correctly
    if (skills) updateFields.skills = skills; // Ensure skills is mapped correctly
    if (interests) updateFields.interests = interests; // Ensure interests is mapped correctly
    if (selectedCategory) updateFields.categoryUserRole = selectedCategory; // Map selectedCategory to role_type

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
