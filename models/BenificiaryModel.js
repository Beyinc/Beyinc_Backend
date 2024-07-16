const mongoose = require("mongoose");

const benificiarySchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            // ref: "User",
        },
        customerId: {
            type: String,
            required: true,
            default: null,
        },
        fundaccountId: {
            type: String,
            default: null,
        },
        accountNumber: {
            type: String,
            // required: true,
            default: null,
        },
        upi: {
            type: String,
            // required: true,
            default: null,
        },
        ifsc: {
            type: String,
            // required: true,
            default: null,
        },
      
    },
    {
        timestamps: true, // This adds 'createdAt' and 'updatedAt' fields
    }
);

const Benificiary = new mongoose.model("Benificiary", benificiarySchema);
module.exports = Benificiary;
