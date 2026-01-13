// controllers/availability.controller.js
const mongoose = require("mongoose");
const { book } = require("./calendarController");
const Availability = require("../models/Availability");
const Booking = require("../models/Booking");
const User = require("../models/UserModel.js");
const send_Notification_mail = require("../helpers/EmailSending");

const getBookingConfirmationTemplate = (studentName, mentorName, topic, date, link) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #4CAF50;">Booking Confirmed! ✅</h2>
      <p>Hello <strong>${studentName}</strong>,</p>
      <p>Your session with <strong>${mentorName}</strong> has been successfully booked.</p>
      
      <div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
        <p><strong>Topic:</strong> ${topic}</p>
        <p><strong>Date & Time:</strong> ${new Date(date).toUTCString()}</p>
        <p><strong>Meeting Link:</strong> <a href="${link}">${link}</a></p>
      </div>
      <p>Please join the link 5 minutes before the scheduled time.</p>
    </div>
  `;
};

// 2. New Booking Alert (Sent to Mentor)
const getNewBookingAlertTemplate = (mentorName, studentName, topic, date, link) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2196F3;">New Session Booked! 📅</h2>
      <p>Hello <strong>${mentorName}</strong>,</p>
      <p><strong>${studentName}</strong> has booked a session with you.</p>
      
      <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
        <p><strong>Topic:</strong> ${topic}</p>
        <p><strong>Date & Time:</strong> ${new Date(date).toUTCString()}</p>
        <p><strong>Meeting Link:</strong> <a href="${link}">${link}</a></p>
      </div>
      <p>Check your dashboard for more details.</p>
    </div>
  `;
};

// 3. Reschedule Request (Sent to Student)
const getRescheduleRequestTemplate = (studentName, mentorName, reason) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #FF9800;">Reschedule Requested ⏳</h2>
      <p>Hello <strong>${studentName}</strong>,</p>
      <p>Your mentor, <strong>${mentorName}</strong>, has requested to reschedule your upcoming session.</p>
      
      <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0;">
        <p><strong>Reason provided:</strong> ${reason}</p>
      </div>

      <p>Please log in to your dashboard to discuss a new time or accept the change.</p>
    </div>
  `;
};

// 4. New Feedback Received (Sent to Mentor)
const getFeedbackReceivedTemplate = (mentorName, rating, feedbackText) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #FFC107;">You received new feedback! ⭐</h2>
      <p>Hello <strong>${mentorName}</strong>,</p>
      <p>A student has left feedback for a recent session.</p>
      
      <div style="background-color: #fff8e1; padding: 15px; margin: 20px 0;">
        <p><strong>Rating:</strong> ${rating} / 5</p>
        <p><strong>Comment:</strong> "${feedbackText}"</p>
      </div>

      <p>Keep up the great work!</p>
    </div>
  `;
};


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
      selectedTimezone, 
      duration,
      title,
      description,
    } = bookingData; 

    // Validate required fields
    if (
      !mentorId ||
      !user_id ||
      !startDateTimeUTC ||
      !endDateTimeUTC ||
      !duration ||
      !meetLink
    ) {
      throw new Error("Missing required booking details.");
    }

    // Convert mentorId and user_id to Mongoose ObjectId
    const ObjectId = mongoose.Types.ObjectId;
    if (!ObjectId.isValid(mentorId) || !ObjectId.isValid(user_id)) {
      throw new Error("Invalid mentor or user ID.");
    }

    const mentorObjectId = new ObjectId(mentorId);
    const userObjectId = new ObjectId(user_id);
    const finalAmountValue = finalAmount || 0;
    const discountPercentValue = discountPercent || 0;
    const descriptionValue = description || ''; 

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
      status: "upcoming", 
    });

    // Save the booking to the database
    const savedBooking = await newBooking.save();

    // --- NEW EMAIL LOGIC (Notify Student and Mentor) ---
    try {
        const mentor = await User.findById(mentorId);
        const student = await User.findById(user_id);

        if (mentor && student) {
            // 1. Notify Student
            const studentMsg = getBookingConfirmationTemplate(student.userName, mentor.userName, title, startDateTimeUTC, meetLink);
            await send_Notification_mail(student.email, "Booking Confirmed! ✅", studentMsg, student.email, "", {});
            
            // 2. Notify Mentor
            const mentorMsg = getNewBookingAlertTemplate(mentor.userName, student.userName, title, startDateTimeUTC, meetLink);
            await send_Notification_mail(mentor.email, "New Session Booked! 📅", mentorMsg, mentor.email, "", {});
            
            console.log("Booking emails sent successfully.");
        }
    } catch (emailErr) {
        console.error("Failed to send booking emails:", emailErr);
    }
    // --- EMAIL LOGIC ENDS ---

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
    console.log("Request body:", req.body);

    if (typeof booleanValue !== "boolean") {
      console.log("Invalid boolean value type:", { booleanValue });
      return res.status(400).json({ error: "booleanValue must be a boolean" });
    }

    if (typeof rescheduleReason !== "string") {
      console.log("Invalid reschedule reason type:", { rescheduleReason });
      return res.status(400).json({ error: "rescheduleReason must be a string" });
    }

    console.log("Updating document with ID:", id);

    const result = await Booking.findByIdAndUpdate(
      id,
      {
        mentorReschedule: [booleanValue, rescheduleReason], 
      },
      { new: true, runValidators: true }
    );

    if (!result) {
      console.log("Document not found for ID:", id);
      return res.status(404).json({ error: "Document not found" });
    }

    // --- NEW EMAIL LOGIC (Notify Student) ---
    if (booleanValue === true) { 
        try {
            const bookingDetails = await Booking.findById(id)
                .populate('userId', 'email userName')
                .populate('mentorId', 'userName');

            if (bookingDetails && bookingDetails.userId) {
                const emailBody = getRescheduleRequestTemplate(
                    bookingDetails.userId.userName, 
                    bookingDetails.mentorId.userName, 
                    rescheduleReason
                );

                await send_Notification_mail(
                    bookingDetails.userId.email,
                    "Reschedule Request from Mentor ⏳",
                    emailBody,
                    bookingDetails.userId.email,
                    "",
                    {}
                );
                console.log(`Reschedule notification sent to ${bookingDetails.userId.email}`);
            }
        } catch (emailErr) {
            console.error("Failed to send reschedule email:", emailErr);
        }
    }
    // --- EMAIL LOGIC ENDS ---

    console.log("Type of mentorReschedule:", typeof result.mentorReschedule);
    console.log("Document updated successfully:", result);
    res.status(200).json(result);
  } catch (error) {
    console.error("Server error:", error.message);
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: `Cast error: ${error.message}` });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Add feedback to a specific booking by _id
exports.addFeedback = async (req, res) => {
  try {
    console.log(req.body);
    const { feedback, bookingId } = req.body; 

    if (!Array.isArray(feedback) || feedback.length !== 2) {
      return res.status(400).json({
        message: "Feedback must be an array with two strings: [rating, feedback text].",
      });
    }

    const rating = feedback[0];
    const feedbackText = feedback[1];

    if (isNaN(rating) || typeof feedbackText !== "string") {
      return res.status(400).json({
        message: "Invalid feedback format: rating should be a string representing a number, and feedback should be a string.",
      });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { $push: { feedback } }, 
      { new: true } 
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // --- NEW EMAIL LOGIC (Notify Mentor) ---
    try {
        const bookingDetails = await Booking.findById(bookingId).populate('mentorId', 'email userName');

        if (bookingDetails && bookingDetails.mentorId) {
            const emailBody = getFeedbackReceivedTemplate(
                bookingDetails.mentorId.userName, 
                rating, 
                feedbackText
            );

            await send_Notification_mail(
                bookingDetails.mentorId.email,
                "New Feedback Received! ",
                emailBody,
                bookingDetails.mentorId.email,
                "",
                {}
            );
            console.log(`Feedback notification sent to ${bookingDetails.mentorId.email}`);
        }
    } catch (emailErr) {
        console.error("Failed to send feedback email:", emailErr);
    }
    // --- EMAIL LOGIC ENDS ---

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


