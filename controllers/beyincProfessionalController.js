const User = require("../models/UserModel");



// Update the beyincProfile field
exports.saveBeyincProfile = async (req, res) => {
  
  // const { beyincProfile,expertise,industries,stages,investmentRange } = req.body; // Extract user_id and beyincProfile from request
  const {data} = req.body
  const { user_id } = req.payload; 

  console.log(beyincProfile,expertise,industries,stages,investmentRange);
  

  console.log('saving', data, user_id);
  if (!beyincProfile) {
    return res.status(400).json({ message: 'Profile role is required' });
  }

  try {
    // Find the user by ID and update the beyincProfile field
    const user = await User.findByIdAndUpdate(
      user_id,
      // {  beyincProfile,expertise,industries,stages,investmentRange },
      {data},
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
