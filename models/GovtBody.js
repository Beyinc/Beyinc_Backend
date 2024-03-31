const mongoose = require("mongoose");

const GovernmentBodySchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  about: {
    type: String,
    required: false,
  },
  department: {
    type: String,
    required: false,
  },
  interestedDomain: {
    type: [String],
    required: false,
  },
  skills: {
    type: [String],
    required: false,
  },
  profile: {
    type: String,
    required: false,
  },
  banner: {
    type: String,
    required: false,
  },
  poc_name: {
    type: String,
    required: false,
  },
  poc_designation: {
    type: String,
    required: false,
  },
  poc_mobile: {
    type: String,
    required: false,
  },
  poc_email: {
    type: String,
    required: false,
  },
  website: {
    type: String,
    required: false,
  },
  location: {
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
});

const GovernmentBody = mongoose.model("GovernmentBody", GovernmentBodySchema);

module.exports = GovernmentBody;
