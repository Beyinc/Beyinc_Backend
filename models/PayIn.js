const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true
    },
    order_id: {
      type: String,
      required: true
    },
    method: {
      type: String,
      required: true
    },
    amount_refunded: {
      type: Number,
      default: 0
    },
    refund_status: {
      type: String,
      default: null
    },
    captured: {
      type: Boolean,
      required: true
    },
    description: {
      type: String,
    },
    international: {
      type: Boolean,
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
);

const PayIn = mongoose.model('PayIn', paymentSchema);

module.exports = PayIn;
