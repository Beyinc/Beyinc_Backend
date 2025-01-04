const User = require("../models/UserModel");

exports.saveProfileData = async (req, res) => {
  const { user_id } = req.payload;

  const { beyincProfile, expertise, industries, stages, investmentRange } =
    req.body.data;

  if (!beyincProfile) {
    return res.status(400).json({ message: "Profile role is required" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      user_id,
      {
        beyincProfile,
        expertise,
        industries,
        stages,
        investmentRange,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "Profile role updated successfully", user });
  } catch (error) {
    console.error("Error updating beyincProfile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.fetchProfileData = async (req, res) => {
  const { user_id } = req.payload;

  try {
    const user = await User.findById(user_id).select(
      "beyincProfile industries expertise -_id"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile role:", userData: user });
  } catch (error) {
    console.error("Error in loading profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};
