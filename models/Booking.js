const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentorTz: { type: String, required: true },
  userTz: { type: String, required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  duration: { type: Number, required: true},
  amount: { type: Number, required: true },
  finalAmount: { type: Number, required: true },
  discountPercent: { type: Number, required: true},
  currency: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  eventId: { type: String, required: true },
  meetLink: { type: String, required: true },
  reschedule: { type: Boolean, default: false }, 
  mentorReschedule: {
    type: [mongoose.Schema.Types.Mixed], // Use Mixed to allow an array with mixed types
  },
  feedback: {type: [String]},
  status: { type: String, enum: ['upcoming',  'completed', 'cancelled']}
}, { timestamps: true });

const Booking = mongoose.model('BookingData', bookingSchema);

module.exports = Booking;
