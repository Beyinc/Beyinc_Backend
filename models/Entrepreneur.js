const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    profile: { type: String, required: false },
    banner: { type: String, required: false },
    haveStartup: { type: String, required: false },
    startupStage: { type: String, required: false },
    startupDate: { type: Date, required: false },
    total_customers: { type: String, required: false },
    turnover: { type: String, required: false },
    isStartupRegistered: { type: String, required: false },
    startupCIN: { type: String, required: false },
    startupDomain: [{ type: String, required: false }], // Array of strings
    location: { type: String, required: false },
    website: { type: String, required: false },
    experience: { type: String, required: false },
    education: { type: String, required: false },
    linkedin: { type: String, required: false },
    twitter: { type: String, required: false },
  },
  {
    timestamps: true, // This adds 'createdAt' and 'updatedAt' fields
  }
);

const Entrepreneur = new mongoose.model("Entrepreneur", userSchema);
module.exports = Entrepreneur;
