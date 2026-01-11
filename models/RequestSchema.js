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
  requestDeclined:{
    type: Boolean,
    default: false,
  },
  declineReason:{
    type: String,
  },
  booked:{
    type: Boolean,
    default: false,
  },
  title:{
    type: String,
  }

},{ timestamps: true });




const RequestData = mongoose.model("RequestData", requestSchema);
module.exports = RequestData;
