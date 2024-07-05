const { authSchema } = require("../helpers/validations");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    signEmailOTpToken,
    verifyEmailOtpToken,
} = require("../helpers/jwt_helpers");
const User = require("../models/UserModel");
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });
const twilio = require("twilio");
const cloudinary = require("../helpers/UploadImage");
const Notification = require("../models/NotificationModel");
const send_Notification_mail = require("../helpers/EmailSending");
const razorpay = require("../helpers/Razorpay");
const Benificiary = require("../models/BenificiaryModel");

exports.orders = async (req, res, next) => {
    const { amount, currency, email } = req.body;
    try {
        const options = {
            amount: amount * 100,
            currency: currency,
            receipt: `receipt_order_${new Date().getTime()}`
        };
        const order = await razorpay.orders.create(options);
        return res.status(200).json(order);
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: error.message });
    }
};

exports.success = async (req, res, next) => {
    const { paymentId, amount, userId } = req.body;


    try {
        const payment = await razorpay.payments.fetch(paymentId);
        if (payment.status === 'captured') {

            await User.updateOne(
                { _id: userId },
                { $inc: { realMoney: parseFloat(amount) } }
            ); return res.status(200).json({ success: true });
        } else {
            return res.status(400).json({ error: 'Payment not captured' });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


exports.fetchUserBalance = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);
        if (req.params.type == 'freeMoney') {
            return res.status(200).json({ balance: user.freeMoney });
        }
        return res.status(200).json({ balance: user.realMoney });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.addBenificiaryAccount = async (req, res, next) => {
    try {
        const { userId, userName, email, phone, accountNumber, ifsc } = req.body;
        const beneficiaryDetails = {
            name: userName,
            email: email,
            contact: phone,

        };
        const userExist = await Benificiary.findOne({ customer: userId })
        if (!userExist) {

            if (beneficiaryDetails?.account_number !== '' && beneficiaryDetails?.ifsc_code !== '') {
                const benificaryInfo = await razorpay.customers.create(beneficiaryDetails);

                const bankDetails = {
                    beneficiary_name: userName,
                    account_number: accountNumber,
                    ifsc_code: ifsc,
                }
                await razorpay.customers.addBankAccount(benificaryInfo.id, bankDetails)
                await Benificiary.create({ accountNumber: accountNumber, ifsc: ifsc, beneficiaryId: benificaryInfo.id, customer: userId })
                return res.status(200).json('Bank account added');
            }
            return res.status(400).json('Account Number and ifsc is required');

        } else if (userExist.accountNumber == null || userExist.ifsc == null) {
            await Benificiary.updateOne({ customer: userId }, { $set: { accountNumber: accountNumber, ifsc: ifsc } })
            return res.status(200).json('Bank account added');
        } else {
            return res.status(400).json('Customer details already there');
        }
    }
    catch (error) {
        console.log(error)
        return res.status(400).json(error.error.description);
    }
}

exports.transferCoins = async (req, res, next) => {
    const { senderId, receiverId, amount } = req.body;

    try {
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (sender.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }


        sender.balance -= amount;
        await sender.save();


        receiver.balance += amount;
        await receiver.save();


        const payoutResponse = await axios.post('/api/payouts/transfer', {
            amount: amount,
            beneficiary_id: receiver.beneficiary_id,
        });

        return res.json({ success: true, payoutResponse: payoutResponse.data });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


exports.payOutTransfer = async (req, res, next) => {
    const { amount, beneficiary_id } = req.body;

    const payoutDetails = {
        account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
        fund_account_id: beneficiary_id,
        amount: amount * 100,
        currency: 'INR',
        mode: 'IMPS',
        purpose: 'payout',
        queue_if_low_balance: true
    };

    try {
        const response = await razorpay.payouts.create(payoutDetails);
        return res.json(response);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}