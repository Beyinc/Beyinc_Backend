// controllers/requestController.js (or similar)
const Request = require("../models/RequestSchema.js");
const User = require("../models/UserModel.js");
const send_Notification_mail = require("../helpers/EmailSending");

// --- ADDED: Email Templates ---
const getCallRequestTemplate = (mentorName, studentName, message, duration) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #4CAF50;">New Call Request!</h2>
      <p>Hello <strong>${mentorName}</strong>,</p>
      <p>You have received a new mentorship call request from <strong>${studentName}</strong>.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
        <p><strong>Topic/Message:</strong> ${message}</p>
        <p><strong>Duration:</strong> ${duration} minutes</p>
      </div>

      <p>Please log in to your dashboard to accept or decline this request.</p>
      <br>
    </div>
  `;
};

const getRequestAcceptedTemplate = (studentName, mentorName) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #4CAF50;">Good News! Request Accepted</h2>
      <p>Hello <strong>${studentName}</strong>,</p>
      <p>Your mentorship request to <strong>${mentorName}</strong> has been <strong>ACCEPTED</strong>!</p>
      <p>Please check your dashboard for the scheduled time and meeting link details.</p>
      <br>
    </div>
  `;
};

const getRequestDeclinedTemplate = (studentName, mentorName, reason) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #D32F2F;">Request Update</h2>
      <p>Hello <strong>${studentName}</strong>,</p>
      <p>Your mentorship request to <strong>${mentorName}</strong> has been declined.</p>
      
      <div style="background-color: #fff0f0; padding: 15px; border-left: 4px solid #D32F2F; margin: 20px 0;">
        <p><strong>Reason:</strong> ${reason || "No specific reason provided."}</p>
      </div>

      <p>Don't be discouraged! You can try requesting a different time or exploring other mentors.</p>
      <br>
    </div>
  `;
};

exports.createNewRequest = async (requestData, res) => {
  try {
    // Note: The new code includes 'title', so we keep that.
    const { userId, mentorId, requestMessage, requestType, amount, duration, title } = requestData.body;

    // The new code commented out the duplicate check.
    // const alreadyExists = await Request.findOne({ userId, mentorId });
    // if (alreadyExists) {
    //    return res.status(400).json({ message: "Request already exists." });
    // }

    const newRequest = await Request.create({
      userId,
      mentorId,
      requestMessage,
      requestType,
      amount,
      duration,
      title
    });

    // --- ADDED: Email Logic for New Request (Notify Mentor) ---
    try {
      const mentor = await User.findById(mentorId);
      const student = await User.findById(userId);

      if (mentor && mentor.email) {
        const emailBody = getCallRequestTemplate(
            mentor.userName, 
            student.userName, 
            requestMessage, 
            duration
        );

        await send_Notification_mail(
          mentor.email,                
          "New Mentorship Call Request", 
          emailBody,                   
          mentor.email,                
          "",                          
          {}                           
        );
        console.log(`Notification sent to ${mentor.email}`);
      }
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
    }
    // -----------------------------------------------------------

    res.status(201).json({
      message: "Request created successfully",
      request: newRequest,
    });
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getUserPendingRequests = async (req, res) => {
  try {
    const userId = req.payload.user_id;

    console.log("userId", userId);
    const pendingRequests = await Request.find({
      userId,
    })
      .populate("mentorId", "email userName phone") 
      .populate("userId", "email userName phone") 
      .exec();

    res.status(200).json({ pendingRequests });
  } catch (error) {
    console.error("Error fetching user pending requests:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getMentorPendingRequests = async (req, res) => {
  try {
    const mentorId = req.payload.user_id;

    const pendingRequests = await Request.find({
      mentorId,
    })
      .populate("mentorId", "email userName phone") 
      .populate("userId", "email userName phone") 
      .exec();

    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error("Error fetching mentor pending requests:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateRequestStatusByMentor = async (req, res) => {
  try {
    const { requestId } = req.body;

    const updatedRequest = await Request.findByIdAndUpdate(
      requestId,
      { requestStatus: true },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    // --- ADDED: Email Logic for Accepted Request (Notify Student) ---
    try {
        // We need to fetch user details to send email
        const fullRequest = await Request.findById(requestId)
            .populate('userId')
            .populate('mentorId');
            
        if (fullRequest && fullRequest.userId && fullRequest.mentorId) {
            const emailBody = getRequestAcceptedTemplate(
                fullRequest.userId.userName, 
                fullRequest.mentorId.userName
            );
            
            await send_Notification_mail(
                fullRequest.userId.email,
                "Request Accepted! ✅",
                emailBody,
                fullRequest.userId.email,
                "",
                {}
            );
            console.log(`Acceptance email sent to student: ${fullRequest.userId.email}`);
        }
    } catch (emailErr) {
        console.error("Failed to send acceptance email:", emailErr);
    }
    // ----------------------------------------------------------------

    res.status(200).json({
      message: "Request accepted",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.declineRequestByMentor = async (req, res) => {
  try {
    const { requestId, declineReason } = req.body;

    const updatedRequest = await Request.findByIdAndUpdate(
      requestId,
      { requestDeclined: true, requestStatus: false ,declineReason: declineReason},
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    // --- ADDED: Email Logic for Declined Request (Notify Student) ---
    try {
        const fullRequest = await Request.findById(requestId)
            .populate('userId')
            .populate('mentorId');

        if (fullRequest && fullRequest.userId && fullRequest.mentorId) {
            const emailBody = getRequestDeclinedTemplate(
                fullRequest.userId.userName, 
                fullRequest.mentorId.userName,
                declineReason
            );
            
            await send_Notification_mail(
                fullRequest.userId.email,
                "Request Status Update",
                emailBody,
                fullRequest.userId.email,
                "",
                {}
            );
            console.log(`Decline email sent to student: ${fullRequest.userId.email}`);
        }
    } catch (emailErr) {
        console.error("Failed to send decline email:", emailErr);
    }
    // ---------------------------------------------------------------

    res.status(200).json({
      message: "Request declined",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error declining request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.deleteRequestByMentor = async (req, res) => {
  try {
    const { requestId } = req.body;
    console.log("id from frontend",requestId);
    await Request.findOneAndDelete({ _id: requestId });

    res.status(200).json({
      message: "Request deleted successfully",
    });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};