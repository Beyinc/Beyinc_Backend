const mongoose = require("mongoose");

const benificiarySchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        accountNumber: {
            type: String,
            required: true,
            default: null,
        },
        ifsc: {
            type: String,
            required: true,
            default: null,
        },
        beneficiaryId: {
            type: String,
            default: null,
        }
    },
    {
        timestamps: true, // This adds 'createdAt' and 'updatedAt' fields
    }
);

const Benificiary = new mongoose.model("Benificiary", benificiarySchema);
module.exports = Benificiary;
