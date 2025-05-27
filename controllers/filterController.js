// controllers/userProfileController.js
const User = require("../models/UserModel");

// Filter Data Function
exports.filterData = async (req, res) => {
  const { userName, stages, industries, expertise, categories } = req.body; // Destructure categories from the request body

  console.log("Filtering data with:", { userName, stages, industries, expertise, categories });

  try {
    // Build the query object dynamically based on provided filters
    const query = {};
    
    // Add filters only if they are provided
    
    if (expertise && expertise.length > 0) {
      query.expertise = { $in: expertise }; // Match any of the expertise
    }
    if (userName && userName.length > 1) { // Change to > 1 for better matches
      query.userName = { $regex: new RegExp(userName, 'i') }; 
    }
    if (stages && stages.length > 0) {
      query.stages = { $in: stages }; // Match any of the stages
    }
    if (industries && industries.length > 0) {
      query.industries = { $in: industries }; // Match any of the industries
    }
    if (categories && categories.length > 0) { // Check if categories are provided
      query.beyincProfile = { $regex: new RegExp(categories.join('|'), 'i') }; // Match any of the categories, case-insensitive
    }
    

    // Fetch users based on the constructed query
   const usersRaw = await User.find(query);
    const requestingUser = req.payload
    const users = usersRaw.filter(user => user.isProfileComplete && user.email !== requestingUser.email); 
    
    // Return the filtered users
    res.status(200).json(users);
  } catch (error) {
    console.error("Error filtering data:", error);
    res.status(500).json({ message: "Server error" });
  }

  
};


// Filter Data Function
exports.filterSearch = async (req, res) => {
  const { interests, query } = req.body; // Destructure interests and search query

  console.log("Filtering data with:", { interests, query });

  try {
    const queryObj = {};

    // Apply name/email search filter (if query is provided)
    if (query) {
      queryObj.$or = [
        { userName: { $regex: query, $options: 'i' } }, // Case-insensitive search
        { email: { $regex: query, $options: 'i' } }    // You can search by email as well
      ];
    }

    // Apply interests filter if provided
    if (interests && interests.length > 0) {
      queryObj.interests = { $in: interests }; // Filter profiles by their interests (e.g., "mentor")
    }

    // Fetch users based on the constructed query object
    const users = await User.find(queryObj);

    // Return the filtered users
    res.status(200).json(users);
  } catch (error) {
    console.error("Error filtering data:", error);
    res.status(500).json({ message: "Server error" });
  }
};


