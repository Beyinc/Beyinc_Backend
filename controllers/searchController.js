
const User = require("../models/UserModel");


exports.searchProfiles = async (req, res) => {
    const { query } = req.query; // Get search query from URL params
    console.log(query);
    
  
    try {
      // Search logic here (e.g., searching by name in the database)
      const profiles = await User.find({ userName: { $regex: query, $options: "i" } }); // Case-insensitive search
  
      if (profiles.length) {
        res.status(200).json(profiles);
      } else {
        res.status(404).json({ message: "No profiles found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
  
  
  