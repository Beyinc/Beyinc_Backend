const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  requestMessage: {
    type: String,
    required: true,
  },

  requestType: {
    type: String,
    // enum: ["session", "webinar", "priority dm"," "],
  },
  amount: {
    type: Number,
  },
  duration: {
    type: Number,
  },

  requestStatus: {
    type: Boolean,
    default: false,
  },
});

const RequestData = mongoose.model("RequestData", requestSchema);
module.exports = RequestData;
