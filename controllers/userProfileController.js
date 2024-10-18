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
