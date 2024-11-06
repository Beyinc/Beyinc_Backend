const mongoose = require('mongoose');
const { Schema } = mongoose;

const PayoutSchema = new Schema({
  mentorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bank: {
    name: {
      type: String,
      required: true
    },
    accNo: {
      type: String,
      required: true
    },
    ifsc: {
      type: String,
      required: true
    },
    currency: {
      type: String,
      required: true
    }
  },
  upi: {
    type: String,
    required: false
  },
  withdrawlData: [
    {
      totalAmount: {
        type: Number,
        required: true
      },
      withdrawlAmount: {
        type: Number,
        required: true
      },
      sessionData: {
        bookingIds: [
          {
            type: Schema.Types.ObjectId,
            ref: 'BookingData',
            required: true
          }
        ],
        payoutStatus: {
          type: String,
          enum: ['Pending', 'Completed', 'Failed'],
          default: 'Pending'
        },
        payoutId: {
          type: String,
          required: true
        },
        payoutProof: {
          type: String,
          required: false
        }
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Payout', PayoutSchema);
