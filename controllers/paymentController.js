const { instance } = require('../helpers/razorpayInstance.js');
const crypto = require('crypto');
const Payment = require('../models/paymentModel');

console.log(instance.orders)

const checkout = async (req, res) => {
  const options = {
    amount: Number(req.body.amount * 100), // convert to paise
    // amount : 5000,
    currency: 'INR',
  };
  const order = await instance.orders.create(options);

  res.status(200).json({
    success: true,
    order,
  });
};

const paymentVerification = async (req, res) => {
  console.log(req.body);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_APT_SECRET)
    .update(body.toString())
    .digest('hex');

  console.log('sign received', razorpay_signature);
  console.log('expected signature', expectedSignature);

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {

     // Check if Payment model is defined before creating a payment
     console.log('Creating payment with model:', Payment);
      
    // Database comes here
    await Payment.create({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    console.log(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    res.redirect(
      `http://localhost:3000/paymentsuccess?reference=${razorpay_payment_id}`
    );
  } else {
    res.status(400).json({
      success: false,
    });
  }
};

module.exports = {
  checkout,
  paymentVerification,
};
