const mongoose = require("mongoose");


const Schema = mongoose.Schema;

const couponSchema = new Schema({
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true }, // 'free_demo' or 'discount'
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    isUsed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
