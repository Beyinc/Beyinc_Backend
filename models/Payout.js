const mongoose = require('mongoose');
const { Schema } = mongoose;

const PayoutSchema = new Schema({
  mentorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  bank: {
    name: {
      type: String,
      required: false
    },
    accNo: {
      type: String,
      required: false
    },
    ifsc: {
      type: String,
      required: false
    },
    currency: {
      type: String,
      required: false
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
        required: false
      },
      withdrawlAmount: {
        type: Number,
        required: false
      },
      sessionData: {
        bookingIds: [
          {
            type: Schema.Types.ObjectId,
            ref: 'BookingData',
            required: false
          }
        ],
        payoutStatus: {
          type: String,
          enum: ['Pending', 'Completed', 'Failed'],
          default: 'Pending'
        },
        payoutId: {
          type: String,
          required: false
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
