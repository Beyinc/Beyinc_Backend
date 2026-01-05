// controllers/availability.controller.js
const mongoose = require("mongoose");
const { book } = require("./calendarController");
const Availability = require("../models/Availability");
const Booking = require("../models/Booking");
// Helper function to convert duration to days
const convertDurationToDays = (duration) => {
  const [value, unit] = duration.split(" ");
  const numValue = parseInt(value, 10);
  switch (unit) {
    case "week":
    case "weeks":
      return numValue * 7;
    case "month":
    case "months":
      return numValue * 30; // Approximate number of days in a month
    default:
      return 0;
  }
};

// Helper function to map day names to numbers
const mapDaysToNumbers = (days) => {
  const dayMap = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 0,
  };
  return days.map((day) => dayMap[day] || 0);
};

// Helper function to convert ISO date string to readable format
const convertToReadableDate = (isoDateStr) => {
  const date = new Date(isoDateStr);
  return date.toString(); // Converts to 'Sat Aug 10 2024 16:36:57 GMT+0530 (India Standard Time)'
};

exports.saveSettings = async (req, res) => {
  console.log("body", req.body);
  const userId = req.payload.user_id; // Assuming user_id comes from token or session
  console.log("userid", userId);

  try {
    const {
      unavailableDates,
      selectedDayTimeUtc,
      selectedTimezone,
      startDate,
      endDate,
      noticePeriod,
      bufferTime,
      reschedulePolicy, // Add reschedulePolicy here
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
      if (reschedulePolicy) {
        availability.reschedulePolicy = reschedulePolicy; // Update reschedulePolicy
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
        bufferTime: bufferTime,
        reschedulePolicy: reschedulePolicy, // Add reschedulePolicy for new record
      });
    }

    console.log("before saving", availability);

    await availability.save();

    console.log("after saving", availability);
    res.status(200).json({
      message: "Availability data saved successfully",
      data: availability,
    });
  } catch (error) {
    console.error("Error saving availability data", error);
    res.status(500).json({ message: "Error saving availability data", error });
  }
};

// Save schedule data (unavailableDates and selectedDayTimeUtc)
exports.saveSchedule = async (req, res) => {
  console.log("Request body:", req.body);
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

    console.log("Saving schedule:", availability);

    await availability.save();

    console.log("Schedule saved successfully:", availability);
    res
      .status(200)
      .json({ message: "Schedule saved successfully", data: availability });
  } catch (error) {
    console.error("Error saving schedule:", error);
    res.status(500).json({ message: "Error saving schedule", error });
  }
};

// Get availability data for a specific user
exports.getAvailability = async (req, res) => {
  console.log('API is working');
    console.log('process.env',process.env.PORT,process.env.EMAIL,process.env.EMAIL_PASSWORD);

  let userId = req.payload.user_id; // Assuming user_id comes from token or session
  console.log(userId);
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
  try {
    const {
      sessionId, 
      title,
      description,
      duration,
      amount,
      hostingLink
    } = req.body;

    const userId = req.payload.user_id;

    let availability = await Availability.findOne({ userId });

    if (!availability) {
      availability = new Availability({ userId, sessions: [] });
    }

    if (sessionId) {
      const session = availability.sessions.id(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      session.title = title;
      session.description = description;
      session.duration = duration;
      session.amount = amount;
      session.hostingLink = hostingLink;

    } else {
      availability.sessions.push({
        title,
        description,
        duration,
        amount,
        hostingLink
      });
    }

    await availability.save();

    res.status(200).json({
      message: sessionId
        ? "Session updated successfully"
        : "Session created successfully",
      availability
    });

  } catch (error) {
    console.error("Error saving session data:", error);
    res.status(500).json({
      message: "Error saving session data",
      error: error.message
    });
  }
};






// Controller to save webinar
exports.saveWebinar = async (req, res) => {
  const { webinarData } = req.body;
  console.log("webinar data", webinarData);
  const userId = req.payload.user_id;

  try {
    if (!userId || !webinarData) {
      return res
        .status(400)
        .json({ message: "User ID and webinar data are required." });
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

    res
      .status(201)
      .json({ message: "Webinar saved successfully.", data: webinarData });
  } catch (error) {
    console.error("Error saving webinar:", error);
    res
      .status(500)
      .json({ message: "Error saving webinar. Please try again." });
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

exports.saveBooking = async (bookingData, createdEvent) => {
  const meetLink = createdEvent.hangoutLink;
  const eventId = createdEvent.id;

  console.log("Saving event", eventId, meetLink);
  try {
    const {
      mentorId,
      user_id,
      mentorTimezone,
      amount,
      finalAmount,
      discountPercent,
      currency,
      startDateTimeUTC,
      endDateTimeUTC,
      selectedTimezone, // User's timezone
      duration,
      title,
      description,
    } = bookingData; // Destructure bookingData directly

    // Validate required fields
    if (
      !mentorId ||
      !user_id ||
      !startDateTimeUTC ||
      !endDateTimeUTC ||
      !duration ||
      !meetLink
    ) {
      return res
        .status(400)
        .json({ message: "Missing required booking details." });
    }

    // Convert mentorId and user_id to Mongoose ObjectId
    const ObjectId = mongoose.Types.ObjectId;
    if (!ObjectId.isValid(mentorId) || !ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid mentor or user ID." });
    }

    const mentorObjectId = new ObjectId(mentorId);
    const userObjectId = new ObjectId(user_id);

    const finalAmountValue = finalAmount || 0;
    const discountPercentValue = discountPercent || 0;
    const descriptionValue = description || ''; // Provide default empty string if description is missing

    // Create a new booking record
    const newBooking = new Booking({
      mentorId: mentorObjectId,
      userId: userObjectId,
      mentorTz: mentorTimezone,
      userTz: selectedTimezone,
      startDateTime: startDateTimeUTC,
      endDateTime: endDateTimeUTC,
      duration,
      amount,
      finalAmount: finalAmountValue,
      discountPercent: discountPercentValue,
      currency,
      title,
      description: descriptionValue,
      eventId,
      meetLink,
      status: "upcoming", // Default status
    });

    // Save the booking to the database
    const savedBooking = await newBooking.save();

    return savedBooking;
  } catch (error) {
    throw new Error(`Error saving booking: ${error.message}`);
  }
};

exports.getBookingsMentor = async (req, res) => {
  try {
    // const mentorId = req.payload.user_id;
    const { mentorId } = req.body;
    console.log(`mentorId from payload: ${mentorId}`); // Log mentorId

    if (!mentorId) {
      return res
        .status(400)
        .json({ success: false, message: "mentorId is required" });
    }

    console.log("Fetching bookings for mentorId:", mentorId); // Log the query starting

    const bookings = await Booking.find({ mentorId })
      .populate("mentorId", "email userName phone") // Populate mentorId with specific fields
      .populate("userId", "email userName phone") // Populate userId with specific fields
      .exec();

    // console.log("Bookings found:", bookings); // Log the bookings retrieved

    // if (!bookings.length) {
    //   return res.status(400).json({ success: false, message: 'No bookings found for this mentor' });
    // }

    res.status(200).json({ success: true, mentorBookings: bookings });
  } catch (error) {
    console.error("Error getting bookings by mentorId:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getBookingsUser = async (req, res) => {
  try {
    const userId = req.payload.user_id;

    console.log(`userId from payload: ${userId}`); // Log userId

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

    console.log("Fetching bookings for userId:", userId); // Log the start of the query

    const bookings = await Booking.find({ userId })
      .populate("mentorId", "email userName phone") // Populate mentorId with specific fields
      .populate("userId", "email userName phone") // Populate userId with specific fields
      .exec();

    // console.log("Bookings found:", bookings); // Log the bookings found

    if (!bookings.length) {
      return res
        .status(404)
        .json({ success: false, message: "No bookings found for this user" });
    }

    res.status(200).json({ success: true, userBookings: bookings });
  } catch (error) {
    console.error("Error getting bookings by userId:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update controller function
exports.updateMentorReschedule = async (req, res) => {
  const { id, booleanValue, rescheduleReason } = req.body;

  try {
    // Log request body
    console.log("Request body:", req.body);

    // Validate input
    if (typeof booleanValue !== "boolean") {
      console.log("Invalid boolean value type:", { booleanValue });
      return res.status(400).json({ error: "booleanValue must be a boolean" });
    }

    if (typeof rescheduleReason !== "string") {
      console.log("Invalid reschedule reason type:", { rescheduleReason });
      return res
        .status(400)
        .json({ error: "rescheduleReason must be a string" });
    }

    // Log document ID
    console.log("Updating document with ID:", id);

    // Find and update the document
    const result = await Booking.findByIdAndUpdate(
      id,
      {
        mentorReschedule: [booleanValue, rescheduleReason], // Ensure both values are included
      },
      { new: true, runValidators: true }
    );

    // Check if document was found and updated
    if (!result) {
      console.log("Document not found for ID:", id);
      return res.status(404).json({ error: "Document not found" });
    }

    // Log typeof mentorReschedule after the update
    console.log("Type of mentorReschedule:", typeof result.mentorReschedule);

    // Respond with the updated document
    console.log("Document updated successfully:", result);
    res.status(200).json(result);
  } catch (error) {
    console.error("Server error:", error.message);

    if (error instanceof mongoose.Error.CastError) {
      // Handle specific CastError
      return res.status(400).json({ error: `Cast error: ${error.message}` });
    }

    res.status(500).json({ error: "Server error" });
  }
};

// Add feedback to a specific booking by _id
exports.addFeedback = async (req, res) => {
  try {
    console.log(req.body);
    const { feedback, bookingId } = req.body; // Get the feedback from the request body

    // Validate feedback array to ensure it contains two elements
    if (!Array.isArray(feedback) || feedback.length !== 2) {
      return res.status(400).json({
        message:
          "Feedback must be an array with two strings: [rating, feedback text].",
      });
    }

    const rating = feedback[0];
    const feedbackText = feedback[1];

    if (isNaN(rating) || typeof feedbackText !== "string") {
      return res.status(400).json({
        message:
          "Invalid feedback format: rating should be a string representing a number, and feedback should be a string.",
      });
    }

    // Find the booking by _id and update feedback
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { $push: { feedback } }, // Add feedback to the existing array
      { new: true } // Return the updated document
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Feedback added successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).json({
      message: "Server error while adding feedback",
      error: error.message,
    });
  }
};

// Controller to delete a session by sessionId and userId
exports.deleteSessionById = async (req, res) => {
  try {
    const userId = req.payload.user_id;
    const { sessionId } = req.body;

    // Log the incoming request body and user ID for debugging
    console.log("Request Body:", req.body);
    console.log("User ID from Payload:", userId);

    // Find the availability document for the given userId
    const availability = await Availability.findOne({ userId });

    // Log to check if availability document is found
    if (!availability) {
      console.log("Availability document not found for user:", userId);
      return res.status(404).json({ message: "Availability not found" });
    }

    // Log the availability document before deletion
    console.log("Found Availability:", availability);

    // Find the session index by sessionId within the sessions array
    const sessionIndex = availability.sessions.findIndex(
      (session) => session._id.toString() === sessionId
    );

    // Log the session index and sessionId for debugging
    console.log("Session ID:", sessionId);
    console.log("Session Index:", sessionIndex);

    // If session not found, log and return 404
    if (sessionIndex === -1) {
      console.log("Session not found for sessionId:", sessionId);
      return res.status(404).json({ message: "Session not found" });
    }

    // Log the session being deleted
    console.log("Deleting Session:", availability.sessions[sessionIndex]);

    // Remove the session from the array
    availability.sessions.splice(sessionIndex, 1);

    // Save the updated availability document
    await availability.save();

    // Log success message before sending response
    console.log("Session deletion successful, sending 200 status");

    return res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    // Log the error with full details
    console.error("Error occurred during session deletion:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};


