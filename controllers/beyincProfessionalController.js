const User = require("../models/UserModel");

// Update the beyincProfile field
exports.saveBeyincProfile = async (req, res) => {
  // console.log('Incoming request body:', req.body);

    const { data } = req.body; // Destructure 'data' from req.body
    const { user_id } = req.payload; // Make sure 'user_id' is obtained from the JWT token

    // Destructure the needed fields from the 'data' object
    const { beyincProfile, expertise, industries, stages, investmentRange } = data;

    console.log('saving', data, user_id); // Logging for debugging

    // Validate required fields
    if (!beyincProfile) {
        return res.status(400).json({ message: 'Profile role is required' });
    }

    try {
        // Find the user by ID and update the beyincProfile field
        const user = await User.findByIdAndUpdate(
            user_id,
            {
                beyincProfile,
                expertise,
                industries,
                stages,
                investmentRange
            },
            { new: true } // Return the updated document
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Profile role updated successfully', user });
    } catch (error) {
        console.error('Error updating beyincProfile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
