const { authSchema } = require("../helpers/validations");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const crypto = require('crypto')
const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    signEmailOTpToken,
    verifyEmailOtpToken,
} = require("../helpers/jwt_helpers");
const User = require("../models/UserModel");
const Payment = require("../models/PayIn");
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });
const twilio = require("twilio");
const cloudinary = require("../helpers/UploadImage");
const Notification = require("../models/NotificationModel");
const send_Notification_mail = require("../helpers/EmailSending");
const {razorpay }= require("../helpers/Razorpay");
const Benificiary = require("../models/BenificiaryModel");
const PayIn = require("../models/PayIn");
const mongoose = require('mongoose');
const Payout = require("../models/Payout");

// RAZORPAY DOCS
exports.orders = async (req, res, next) => {
    const { amount, currency, email } = req.body;
    console.log( 'body',req.body)
    try {
        const options = {
            amount: Number(amount)*100,
            currency: "INR",
            // receipt: `receipt_order_${new Date().getTime()}`
        };
        
        console.log('options',options);
        console.log(razorpay.orders)
        const order = await razorpay.orders.create(options);
        
        console.log(order)
        

        return res.status(200).json({
            success: true,
            order,
          });
    } catch (error) {
      console.error('Error creating order:', error);
        console.log(error)
        return res.status(500).json({ error: error.message });
    }
};

// Function to check payment capture status
const checkPaymentCapture = async (paymentId, userId,userPayload) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    const {
      amount,
      currency,
      order_id,
      method,
      amount_refunded,
      refund_status,
      captured,
      description,
      international,
    } = payment;

    if (payment && payment.status === 'captured') {
      const paymentDetails = {
        userId,
        paymentId, 
        amount,
        currency,        
        order_id,
        method,
        amount_refunded,
        refund_status,
        captured,
        description,
        international,
      };

      console.log(paymentDetails);

      try {
        // Save the payment details to the database
        const newPayIn = new PayIn(paymentDetails);
        await newPayIn.save();
        console.log('Payment details saved successfully');

    //     const pdfBuffer = await generatePDFReceipt(paymentDetails);

    // // Send notification email with PDF attachment
    //     const attachmentName = `receipt_${paymentId}.pdf`;
    //     // await send_Notification_mail(userEmail, subject, body, userName, fLink
          
          
    //     //   , pdfBuffer, attachmentName);
        const amountInPaise = amount;
        const amountInRupees = (amountInPaise / 100).toFixed(2); // Convert paise to rupees with 2 decimal places

        await send_Notification_mail(
          userPayload.email,
          "Payment successfull",
          `Thank you for your recent payment! We have successfully received your payment. 

          Payment Details:
           Payment ID: ${paymentId}
           Amount: ${amountInRupees}${currency}
           Payment Method: ${method}
         
          `,
          "",
          "",     
        );  


        return { success: true };
      } catch (saveError) {
        console.error('Error saving payment details:', saveError);
        return { success: false, error: 'Error saving payment details' };
      }
    } else {
      return { success: false, error: "Unable to capture payment" };
    }
  } catch (fetchError) {
    console.error('Error fetching payment:', fetchError);
    return { success: false, error: 'Internal Server Error' };
  }
};

// // Function to generate PDF receipt
// const generatePDFReceipt = async (paymentDetails) => {
//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument();
//     const filename = `receipt_${paymentDetails.paymentId}.pdf`;

//     // Pipe the PDF document to a writable stream (in this case, a file).
//     const pdfStream = fs.createWriteStream(filename);
//     doc.pipe(pdfStream);

//     // Example content for the receipt (customize as per your needs)
//     doc.fontSize(12);
//     doc.text(`Receipt for Payment ID: ${paymentDetails.paymentId}`);
//     doc.text(`Amount: ${paymentDetails.amount} ${paymentDetails.currency}`);
//     doc.text(`Date: ${new Date().toLocaleString()}`);

//     // End the document
//     doc.end();

//     pdfStream.on('finish', () => {
//       resolve(filename);
//     });

//     pdfStream.on('error', (error) => {
//       reject(error);
//     });
//   });
// };





// RAZORPAY VERIFICATION

exports.paymentVerification = async (req, res) => {
    try {
      const userPayload = req.payload
      const userId = req.payload.user_id;
      console.log(req.body);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
      const body = razorpay_order_id + "|" + razorpay_payment_id;
  
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_APT_SECRET)
        .update(body.toString())
        .digest("hex");
  
      console.log("Signature received:", razorpay_signature);
      console.log("Expected signature:", expectedSignature);
  
      const isAuthentic = expectedSignature === razorpay_signature;
  
      if (isAuthentic) {
        // Checking capture status
        const paymentId = razorpay_payment_id;
        
        try {
          const captureResult = await checkPaymentCapture(paymentId,userId,userPayload);
          
          if (captureResult.success) {
      
            return res.status(200).json({ success: true });
          } else {
            return res.status(400).json({ error: captureResult.error });
          }
        } catch (error) {
          return res.status(500).json({ error: error.message });
        }
  
      } else {
        return res.status(400).json({ success: false, error: "Invalid signature" });
      }
    } catch (error) {
      console.error('Error in payment verification:', error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

//  OUR VERIFICATION  
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




//  *****   Customer Details can be updated using new email only *****
exports.addBenificiaryAccount = async (req, res, next) => {
  console.log(razorpay.fundAccount)
 

  try {
    const { proffesionType, mobile } = req.body;
    const { user_id, userName, email } = req.payload;
    // console.log(req.body,req.payload)
    const beneficiaryDetails = {
      name: userName,
      email: email,
      contact: mobile,
      type: "employee", // Example type, adjust as necessary
      reference_id: user_id,
      
    };
    console.log(beneficiaryDetails);
    // Check if the user already exists in the Benificiary collection
    const userExist = await Benificiary.findOne({  userId: user_id });
    if (userExist) {
      console.log("Already user exists in the Benificiary collection")
      return res.status(400).json({ error: 'Beneficiary already exists for this user' });
    }

    const auth = Buffer.from(`${process.env.RAZORPAY_API_KEY}:${process.env.RAZORPAY_APT_SECRET}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(beneficiaryDetails)
    });

    

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Razorpay API response error:', errorData);
      throw new Error(`Razorpay API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const responseData = await response.json();
    console.log('Razorpay API response:', responseData);

    // Save the customerId in the Benificiary model
    const newBenificiary = new Benificiary({
      userId:user_id,
      customerId: responseData.id,
      // customerId: "cust_OZ1c3zDvDZXz1H",
     
    });
    await newBenificiary.save();
    res.status(201).json({ message: 'Beneficiary account created successfully in Razorpay and saved in the database', data: newBenificiary });

  } catch (error) {
    console.error('Error adding beneficiary account:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



// Controller function to create a fund account
exports.createFundAccount = async (req, res) => {
  // const contacts = await this.getAllContacts();

  // // Log the fetched contacts
  // console.log('Fetched Contacts:', contacts);

  const { registeredName, accountNumber, ifsc, upiId, method } = req.body;
  const userId = req.payload.user_id;

  try {
    // Find the beneficiary for the given userId
    const beneficiary = await Benificiary.findOne({ userId });

    if (!beneficiary) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(beneficiary);

    // Prepare data for Razorpay based on the method
    let fundAccountData;
    if (method === 'bank') {
      fundAccountData = {
        // contact_id: beneficiary.customerId, 
        contact_id: beneficiary.customerId , 
        account_type: 'bank_account',
        bank_account: {
          name: registeredName,
          ifsc: ifsc,
          account_number: accountNumber
        }
      };
    } else if (method === 'upi') {
      fundAccountData = {
        contact_id: beneficiary.customerId, // Assuming customerId is the contact_id in Razorpay
        account_type: 'vpa',
        vpa: {
          address: upiId
        }
      };
    } else {
      return res.status(400).json({ error: 'Invalid payment method' });
    }
   
    console.log(fundAccountData);
    // Create fund account in Razorpay
    const fundAccount = await razorpay.fundAccount.create(fundAccountData);

    // Log and respond with the created fund account
    console.log('Fund Account:', fundAccount);

     // Validate the created fund account
    await validateFundAccount(fundAccount,registeredName,beneficiary);

    res.status(201).json({ message: 'Fund account created successfully', data: fundAccount });

  } catch (error) {
    console.error('Error adding fund account:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




// Function to validate the fund account
const validateFundAccount = async (fundAccount, registeredName, beneficiary) => {
  try {
    // Perform validation logic here
    // For example, you can make a POST request to validate the fund account
    console.log('Validating Fund Account:', fundAccount);
    const amount = 100;      // in paise for validation   it will get refunded 
    let validationData;

    if (fundAccount.account_type === 'bank_account') {
      validationData = {
        account_number: process.env.BEYINC_RAZORPAY_ACCOUNT,
        fund_account: {
          id: fundAccount.id
        },
        amount: amount,
        currency: 'INR',
        notes: {
          random_key_1: "Make it so.",
          random_key_2: "Tea. Earl Grey. Hot."
        }
      };
    } else if (fundAccount.account_type === 'vpa') {
      validationData = {
        account_number: process.env.BEYINC_RAZORPAY_ACCOUNT,
        fund_account: {
          id: fundAccount.id
        },
        amount: amount,  
        currency: 'INR',
        notes: {
          random_key_1: "Make it so.",
          random_key_2: "Tea. Earl Grey. Hot."
        }
      };
    } else {
      throw new Error('Invalid fund account type');
    }

    const validationResponse = await fetch('https://api.razorpay.com/v1/fund_accounts/validate', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.RAZORPAY_API_KEY}:${process.env.RAZORPAY_API_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validationData)
    });

    if (!validationResponse.ok) {
      const errorData = await validationResponse.json();
      console.error('Validation API response error:', errorData);
      throw new Error(`Validation API error: ${validationResponse.statusText} - ${JSON.stringify(errorData)}`);
    }

    const validationResult = await validationResponse.json();
    console.log('Validation Result:', validationResult);

  // Additional validation checks based on the response
  if (fundAccount.account_type === 'bank_account') {
    if (validationResult.results.account_status !== 'active') {
      throw new Error('Bank account is not active');
    }

    if (validationResult.results.registered_name !== registeredName) {
      throw new Error('Registered name does not match');
    }

    // Save the bank account details in the Benificiary model
    beneficiary.accountNumber = fundAccount.bank_account.account_number;
    beneficiary.ifsc = fundAccount.bank_account.ifsc;
    beneficiary.mode = 'bank'

  } else if (fundAccount.account_type === 'vpa') {
    if (validationResult.results.account_status !== 'active') {
      throw new Error('VPA account is not active');
    }

    // Save the VPA address in the Benificiary model
    beneficiary.upi = fundAccount.vpa.address;
    beneficiary.mode = 'upi'

  }

  await beneficiary.save();


  } catch (error) {
    console.error('Error validating fund account:', error);
    throw new Error('Fund account validation failed');
  }
};


exports.getAllContacts = async (req, res) => {
  try {
    // console.log(razorpay)
    // Fetch all contacts from Razorpay
    const contacts = await razorpay.customers.all();

    // Log and respond with the fetched contacts
    console.log('Contacts:', contacts);
   return contacts;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




 exports.payOutTransfer = async (req, res, next) => {
  const { amount } = req.body;
  const userId = req.payload.user_id;
  console.log(amount);
  try {
    // Find the beneficiary for the given userId
    const beneficiary = await Benificiary.findOne({ userId });

    if (!beneficiary) {
      return res.status(404).json({ error: 'User not found' });
    }

    let payoutDetails;

    if (beneficiary.mode === 'bank') {
      payoutDetails = {
        account_number: process.env.BEYINC_RAZORPAY_ACCOUNT, // Replace with actual field from Benificiary model
        fund_account_id: beneficiary.fundaccountId, // Replace with actual field from Benificiary model
        amount: amount,
        currency: 'INR',
        mode: 'IMPS', // Assuming IMPS for bank transfer
        purpose: 'payout',
        queue_if_low_balance: true
      };
    } else if (beneficiary.mode === 'upi') {
      payoutDetails = {
        account_number: process.env.BEYINC_RAZORPAY_ACCOUNT, // Replace with actual field from Benificiary model
        fund_account_id: beneficiary.fundaccountId, // Replace with actual field from Benificiary model
        amount: amount,
        currency: 'INR',
        mode: 'UPI', // Assuming IMPS for bank transfer
        purpose: 'payout',
        queue_if_low_balance: true
      };
    } else {
      return res.status(400).json({ error: 'Invalid beneficiary mode' });
    }
    
    const response = await razorpay.payouts.create(payoutDetails);
     // Save the payout ID in the Beneficiary model
     beneficiary.payoutId = response.id;
     await beneficiary.save();

    console.log(response);
    return res.json(response);
  } catch (error) {
    console.error('Error in payout transfer:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};



// Controller function to deactivate a fund account
exports.deleteFundAccount = async (req, res, next) => {
  try {
    console.log('deleteFundAccount');
    const userId = req.payload.user_id;

    // Find the beneficiary for the given userId
    const beneficiary = await Benificiary.findOne({ userId });

    if (!beneficiary || !beneficiary.fundaccountId) {
      return res.status(404).json({ error: 'Fund account not found for this user' });
    }

    // Deactivate the fund account in Razorpay
    const response = await fetch(`https://api.razorpay.com/v1/fund_accounts/${beneficiary.fundaccountId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.RAZORPAY_API_KEY}:${process.env.RAZORPAY_APT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        active: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Razorpay API response error:', errorData);
      throw new Error(`Razorpay API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    // Update the beneficiary record to reflect the deactivation
    beneficiary.fundaccountId = null;
    await beneficiary.save();

    // Return success response
    res.status(200).json({ message: 'Fund account deactivated successfully' });

  } catch (error) {
    console.error('Error deactivating fund account:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// Controller function to check payout status
exports.checkPayoutStatus = async (req, res, next) => {
  const userId = req.payload.user_id;

  try {
    // Find the beneficiary for the given userId
    const beneficiary = await Benificiary.findOne({ userId });

    if (!beneficiary || !beneficiary.payoutId) {
      return res.status(404).json({ error: 'Payout ID not found for this user' });
    }

    // Fetch the payout status from Razorpay
    const response = await fetch(`https://api.razorpay.com/v1/payouts/${beneficiary.payoutId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.RAZORPAY_API_KEY}:${process.env.RAZORPAY_API_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Razorpay API response error:', errorData);
      throw new Error(`Razorpay API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const payoutStatus = await response.json();
    console.log('Payout Status:', payoutStatus);

    // Update the beneficiary model with the latest payout status
    beneficiary.payoutStatus = payoutStatus.status;
    await beneficiary.save();

    // Return the payout status to the client
    res.status(200).json({ message: 'Payout status retrieved successfully', data: payoutStatus });

  } catch (error) {
    console.error('Error checking payout status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



exports.saveWithdrawls = async (req, res, next) => {
  const { selectedIds, totalAmount, commission, remainingAmount } = req.body;

  try {
    // Define the data structure based on the withdrawlData schema
    const withdrawlData = {
      withdrawlData: [
        {
          totalAmount,                   // Total amount for this withdrawal
          withdrawlAmount: remainingAmount, // Amount after commission
          sessionData: {
            bookingIds: selectedIds,     // IDs of the selected bookings
          },
        },
      ],
    };

    // Save the data to the database
    const newWithdrawl = new Payout(withdrawlData);
    const savedWithdrawl = await newWithdrawl.save();

    res.status(201).json({
      message: 'Withdrawl data saved successfully',
      data: savedWithdrawl,
    });
  } catch (error) {
    console.error("Error saving withdrawl data:", error);
    res.status(500).json({ message: 'Failed to save withdrawl data', error });
  }
};

