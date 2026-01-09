// controllers/userProfileController.js
const User = require("../models/UserModel");

// Filter Data Function
exports.filterData = async (req, res) => {
  const { userName, stages, industries, expertise, categories, role } =
    req.body; // Destructure categories from the request body

  console.log("Filtering data with:", {
    userName,
    stages,
    industries,
    expertise,
    categories,
  });

  try {
    // Build the query object dynamically based on provided filters
    const query = {};

    // Add filters only if they are provided

    if (expertise && expertise.length > 0) {
      // Match any of the requested expertise against mentorExpertise.skills
      // mentorExpertise is expected to be an array of { industry, skills: [] }
      query["mentorExpertise.skills"] = { $in: expertise };
    }
    if (role && role !== "") {
      query.role_level = role;
    }
    if (userName && userName.length > 1) {
      // Change to > 1 for better matches
      query.userName = { $regex: new RegExp(userName, "i") };
    }
    if (stages && stages.length > 0) {
      query.stages = { $in: stages }; // Match any of the stages
    }
    if (industries && industries.length > 0) {
      // Match requested industries against mentorExpertise.industry
      query["mentorExpertise.industry"] = { $in: industries };
    }
    if (categories && categories.length > 0) {
      // Check if categories are provided
      query.beyincProfile = { $regex: new RegExp(categories.join("|"), "i") }; // Match any of the categories, case-insensitive
    }

    // Fetch users based on the constructed query
    const usersRaw = await User.find(query);
    const requestingUser = req.payload;
    const users = usersRaw.filter(
      (user) => user.isProfileComplete && user.email !== requestingUser.email,
    );

    // Return the filtered users
    res.status(200).json(users);
  } catch (error) {
    console.error("Error filtering data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Filter Startups Function
exports.filterStartups = async (req, res) => {
  const { userName, industries, stage, targetMarket, seekingOptions } =
    req.body;

  try {
    const query = {
      beyincProfile: "Startup",
    };

    // Filter by userName (search in userName field)
    if (userName && userName.trim() !== "") {
      query.userName = { $regex: userName, $options: "i" }; // case-insensitive search
    }

    // Filter by industries (check if ANY selected industry exists in startupProfile.industries)
    if (industries && industries.length > 0) {
      query["startupProfile.industries"] = { $in: industries };
    }

    // Filter by stage
    if (stage && stage.trim() !== "") {
      query["startupProfile.stage"] = stage;
    }

    // Filter by targetMarket (check if selected targetMarket matches)
    if (targetMarket && targetMarket.length > 0) {
      query["startupProfile.targetMarket"] = { $in: targetMarket };
    }

    // Filter by seekingOptions (check if ANY selected option exists in seekingOptions array)
    if (seekingOptions && seekingOptions.length > 0) {
      query.seekingOptions = { $in: seekingOptions };
    }

    console.log("Query being executed:", JSON.stringify(query, null, 2));

    const startups = await User.find(query);

    console.log("Found startups:", startups.length);
    res.status(200).json(startups);
  } catch (error) {
    console.error("Error filtering startups:", error);
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
        { userName: { $regex: query, $options: "i" } }, // Case-insensitive search
        { email: { $regex: query, $options: "i" } }, // You can search by email as well
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
