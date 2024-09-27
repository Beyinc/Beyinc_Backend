// controllers/availability.controller.js
const mongoose = require('mongoose');
const {book} =require('./calendarController');
const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
// Helper function to convert duration to days
const convertDurationToDays = (duration) => {
  const [value, unit] = duration.split(' ');
  const numValue = parseInt(value, 10);
  switch (unit) {
    case 'week':
    case 'weeks':
      return numValue * 7;
    case 'month':
    case 'months':
      return numValue * 30; // Approximate number of days in a month
    default:
      return 0;
  }
};

// Helper function to map day names to numbers
const mapDaysToNumbers = (days) => {
  const dayMap = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 0
  };
  return days.map(day => dayMap[day] || 0);
};

// Helper function to convert ISO date string to readable format
const convertToReadableDate = (isoDateStr) => {
  const date = new Date(isoDateStr);
  return date.toString(); // Converts to 'Sat Aug 10 2024 16:36:57 GMT+0530 (India Standard Time)'
};

exports.saveSettings = async (req, res) => {
  console.log('body', req.body);
  const userId = req.payload.user_id; // Assuming user_id comes from token or session
  console.log('userid', userId);

  try {
    const { 
      unavailableDates,
      selectedDayTimeUtc,
      selectedTimezone,
      startDate,
      endDate,
      noticePeriod,
      bufferTime
    } = req.body;

    // Find existing record for the user
    let availability = await Availability.findOne({ userId });

    if (availability) {
      // Update existing record with only the fields provided in the request
      if (selectedDayTimeUtc) {
        availability.availableDayTimeUtc = selectedDayTimeUtc;
      }
      if (unavailableDates) {
        availability.unavailableDates = unavailableDates;
      }
      if (startDate) {
        availability.startDate = startDate;
      }
      if (endDate) {
        availability.endDate = endDate;
      }
      if (selectedTimezone) {
        availability.mentorTimezone = selectedTimezone;
      }
      if (noticePeriod) {
        availability.noticePeriod = noticePeriod;
      }
      if (bufferTime) {
        availability.bufferTime = bufferTime;
      }
    } else {
      // Create new record with the fields provided in the request
      availability = new Availability({
        userId,
        availableDayTimeUtc: selectedDayTimeUtc,
        unavailableDates: unavailableDates,
        startDate: startDate,
        endDate: endDate,
        mentorTimezone: selectedTimezone,
        noticePeriod: noticePeriod,
        bufferTime:bufferTime
      });
    }

    console.log('before saving', availability);

    await availability.save();

    console.log('after saving', availability);
    res.status(200).json({ message: 'Availability data saved successfully', data: availability });
  } catch (error) {
    console.error('Error saving availability data', error);
    res.status(500).json({ message: 'Error saving availability data', error });
  }
};



// Save schedule data (unavailableDates and selectedDayTimeUtc)
exports.saveSchedule = async (req, res) => {
  console.log('Request body:', req.body);
  const userId = req.payload.user_id; // Assuming user_id comes from token or session

  try {
    const { unavailableDates, selectedDayTimeUtc } = req.body;

    // Find existing availability record for the user
    let availability = await Availability.findOne({ userId });

    if (availability) {
      // Update existing record
      availability.unavailableDates = unavailableDates;
      availability.availableDayTimeUtc = selectedDayTimeUtc;
    } else {
      // Create new record
      availability = new Availability({
        userId,
        unavailableDates,
        availableDayTimeUtc: selectedDayTimeUtc,
      });
    }

    console.log('Saving schedule:', availability);

    await availability.save();

    console.log('Schedule saved successfully:', availability);
    res.status(200).json({ message: 'Schedule saved successfully', data: availability });
  } catch (error) {
    console.error('Error saving schedule:', error);
    res.status(500).json({ message: 'Error saving schedule', error });
  }
};



// Get availability data for a specific user
exports.getAvailability = async (req, res) => {
    console.log('API is working');
    let userId = req.payload.user_id; // Assuming user_id comes from token or session
    
    console.log('mentorId', req.body)

    const {mentorId} = req.body

    if (mentorId !== 'editProfile') { userId=mentorId}

    try {
      // Find the availability record for the user
      const availability = await Availability.findOne({ userId });
  
      if (!availability) {
        return res.status(404).json({ message: 'Availability data not found' });
      }
  
      
      console.log('availability', availability);
      
      // Send the availability data, including period (which is the available duration)
      res.status(200).json({
        message: 'Availability data retrieved successfully',
        availabilityData: {
          availableDayTimeUtc:availability.availableDayTimeUtc,
          period: availability.availableDuration, // Period is now the available duration
          unavailableDates: availability.unavailableDates
        },
        availability
      });
    } catch (error) {
      console.error('Error retrieving availability data:', error);
      res.status(500).json({ message: 'Error retrieving availability data', error });
    }
  };





  exports.saveSingleService = async (req, res) => {
    console.log(req.body);
    try {
      const { title, description, timeDuration, amount, hostingLink } = req.body;
      const userId = req.payload.user_id;
  
      // Create a new session object based on the updated schema
      const newSession = {
        duration: timeDuration,
        title,
        amount,
        description,
        hostingLink, // Added hostingLink to align with the updated sessionSchema
      };
  
      // Find the availability record for the user
      let availability = await Availability.findOne({ userId });
  
      if (availability) {
        // If the availability record exists, add the new session to the sessions array
        availability.sessions.push(newSession);
      } else {
        // If no availability record exists for the user, create a new one
        availability = new Availability({
          userId,
          sessions: [newSession], // Store the new session in the sessions array
        });
      }
  
      // Save the availability record
      await availability.save();
  
      res.status(200).json({ message: 'Session data saved successfully', availability });
    } catch (error) {
      console.error('Error saving session data:', error);
      res.status(500).json({ message: 'Error saving session data', error: error.message });
    }
  };





// Controller to save webinar
exports.saveWebinar = async (req, res) => {
  const { webinarData } = req.body;
  console.log('webinar data', webinarData);
  const userId = req.payload.user_id;
  
  try {
    if (!userId || !webinarData) {
      return res.status(400).json({ message: 'User ID and webinar data are required.' });
    }

    // Find or create the availability document for the user
    let availability = await Availability.findOne({ userId });
    if (!availability) {
      availability = new Availability({ userId });
    }

    // Add or update the webinar data in the availability document
    availability.webinars.push(webinarData);

    // Save the updated document
    await availability.save();

    res.status(201).json({ message: 'Webinar saved successfully.', data: webinarData });
  } catch (error) {
    console.error('Error saving webinar:', error);
    res.status(500).json({ message: 'Error saving webinar. Please try again.' });
  }
};

  
  
  // exports.createPriorityDm = async (req, res) => {
  //   try {
  //     const { title, description, amount, responseTime } = req.body;
  
  //     const userId = req.payload.user_id;
  
  //     // Find the user's availability record
  //     let availability = await Availability.findOne({ userId });
  
  //     if (!availability) {
  //       availability = new Availability({ userId });
  //     }
  
  //     // Add the new priority DM object to the priorityDMs array
  //     availability.priorityDMs.push({
  //       title,
  //       description,
  //       amount,
  //       responseTime
  //     });
  
  //     await availability.save();
  //     res.status(200).json({ message: 'Priority DM data saved successfully!' });
  //   } catch (error) {
  //     console.error('Error saving priority DM data:', error);
  //     res.status(500).json({ message: 'Error saving priority DM data', error });
  //   }
  // };




  exports.saveBooking = async (req, res) => {
    console.log(req.body);
    try {
      const {
        mentorId,
        user_id,
        mentorTimezone,
        amount,
        currency,
        startDateTimeUTC,
        endDateTimeUTC,
        selectedTimezone, // This is the user's timezone
        duration,
        title,
        description
      } = req.body.bookingData;
  


         // Convert mentorId and user_id to Mongoose ObjectId
      const ObjectId = mongoose.Types.ObjectId;
      const mentorObjectId = new ObjectId(mentorId);
      const userObjectId = new ObjectId(user_id);

      // Create a new booking record
      const newBooking = new Booking({
        mentorId: mentorObjectId,
        userId: userObjectId,
        mentorTz: mentorTimezone,
        userTz: selectedTimezone,
        startDateTime: startDateTimeUTC,
        endDateTime: endDateTimeUTC,
        duration,
        amount, // Calculate amount based on duration and some rate, if applicable
        currency,
        title,
        description,
        status: 'upcoming' // Default status
      });
  
      // Save the booking to the database
      await newBooking.save();
  
      // Respond with success
      res.status(201).json({ message: 'Booking saved successfully', booking: newBooking });
    } catch (error) {
      // Handle errors
      console.error(error);
      res.status(500).json({ message: 'An error occurred while saving the booking', error: error.message });
    }
  };




exports.getBooking = async (req, res) => {
  try {
    // Retrieve all booking records from the database
    const bookings = await Booking.find();

    console.log(bookings);
    // Respond with the array of booking records
    res.status(200).json({ bookings });
  } catch (error) {
    // Handle errors
    console.error('Error retrieving bookings:', error);
    res.status(500).json({ message: 'An error occurred while retrieving the bookings', error: error.message });
  }
};

