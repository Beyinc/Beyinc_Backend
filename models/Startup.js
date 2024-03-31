const mongoose = require("mongoose");

const startupSchema = new mongoose.Schema({
  profile: {
    type: String,
    required: false,
  },
  banner: {
    type: String,
    required: false,
  },
  haveStartup: {
    type: String,
    enum: ["yes", "no"],
    required: false,
  },
  startupStage: {
    type: String,
    required: false,
  },
  startupDate: {
    type: Date,
    required: false,
  },
  total_customers: {
    type: Number,
    required: false,
  },
  turnover: {
    type: Number,
    required: false,
  },
  isStartupRegistered: {
    type: String,
    enum: ["yes", "no"],
    required: false,
  },
  startupCIN: {
    type: String,
    required: function () {
      return this.isStartupRegistered === "yes";
    },
  },
  startupDomain: {
    type: [String],
    required: false,
  },
  location: {
    type: String,
    required: false,
  },
  website: {
    type: String,
    required: false,
  },
  experience: {
    type: String,
    required: false,
  },
  education: {
    type: String,
    required: false,
  },
  linkedin: {
    type: String,
    required: false,
  },
  twitter: {
    type: String,
    required: false,
  },
  Youtube: {
    type: String,
    required: false,
  },
  Instagram: {
    type: String,
    required: false,
  },
  typeStartup: {
    type: String,
    required: false,
  },
});

const Startup = mongoose.model("Startup", startupSchema);

module.exports = Startup;
