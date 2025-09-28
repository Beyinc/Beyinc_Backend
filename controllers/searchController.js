const User = require("../models/UserModel");

exports.searchProfiles = async (req, res) => {
    const { query } = req.query; // Get search query from URL params
    
    try {
      // Search logic with conditions:
      // 1. Only show completed profiles
      // 2. Case-insensitive search on username
      const searchQuery = {
        isProfileComplete: true, // Only show completed profiles
        userName: { $regex: query, $options: "i" } // Case-insensitive search
      };

      // If user is authenticated, exclude their profile
      if (req.user && req.user._id) {
        searchQuery._id = { $ne: req.user._id };
      }
  
      const profiles = await User.find(searchQuery);
  
      if (profiles.length) {
        res.status(200).json(profiles);
      } else {
        res.status(404).json({ message: "No profiles found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
};
  
  
  