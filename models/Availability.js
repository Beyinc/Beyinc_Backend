const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  duration: { type: Number },
  title: { type: String },
  amount: { type: Number },
  hostingLink: { type: String },
  description: { type: String },
});

const webinarSchema = new mongoose.Schema({
  title: { type: String,required: true },
  description: { type: String },
  amount: { type: Number },
  hostingLink: { type: String },
  startDateTime: { type: String, required: true }, // Start time of the webinar (e.g., "14:00")
  endDateTime: { type: String, required: true },   // Stored in HH:mm format
  eventId: { type: String}, 
  bookedWebinars: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BookedWebinar' }] // 
});

const priorityDmSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String },
  amount: { type: Number },
  responseTime: { type: Number }, // Stored in days
});

const availabilitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startDate: { type: Date },
  endDate: { type: Date },
  mentorTimezone: { type: String },
  noticePeriod: { type: Number },
  bufferTime: { type: Number },
  availableDayTimeUtc: {
    type: Map,
    of: [String],
  },
  unavailableDates: [Date],
  sessions:[sessionSchema],
  webinars: [webinarSchema], // Array of webinar objects
  priorityDMs: [priorityDmSchema], // 
});

const Availability = mongoose.model('Availability', availabilitySchema);

module.exports = Availability;
