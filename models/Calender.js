const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  googleCredentials: {
    accessToken: {
      type: String,
      required: true
    },
    refreshToken: {
      type: String,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    }
  },
  roleType: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Calendar = mongoose.model('Calendar', calendarSchema);

module.exports = Calendar;
