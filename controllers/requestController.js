// import Request from "../models/RequestModel.js";

const Request = require("../models/RequestSchema.js");

exports.createNewRequest = async (requestData, res) => {
  try {
    // await console.log("data in backend",requestData.body)
    const { userId, mentorId, requestMessage, requestType,amount,duration } = requestData.body;

    const alreadyExists = await Request.findOne({ userId, mentorId });
    if (alreadyExists) {
      return res.status(400).json({ message: "Request already exists." });
    }

    const newRequest = await Request.create({
      userId,
      mentorId,
      requestMessage,
      requestType,
      amount,
      duration
    });

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
      .populate("mentorId", "email userName phone") // Populate mentorId with specific fields
      .populate("userId", "email userName phone") // Populate userId with specific fields
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
      .populate("mentorId", "email userName phone") // Populate mentorId with specific fields
      .populate("userId", "email userName phone") // Populate userId with specific fields
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

