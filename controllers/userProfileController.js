const User = require("../models/UserModel");

// Save Bio Function
exports.saveBio = async (req, res) => {
console.log("baked 848484848");

  const { bio } = req.body;
//   const { bio } = data;

  const { user_id } = req.payload;

  console.log("Saving bio for user:", user_id);

  if (typeof bio !== "string" || bio.length > 1000) {
    return res.status(400).json({ message: "Invalid bio." });
  }

  try {
    const user = await User.findByIdAndUpdate(user_id, { bio }, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Bio updated successfully", user });
  } catch (error) {
    console.error("Error updating bio:", error);
    res.status(500).json({ message: "Server error" });
  }
};
