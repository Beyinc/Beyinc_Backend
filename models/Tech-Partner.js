const mongoose = require("mongoose");

const TechPartnerSchema = new mongoose.Schema({
  profile: {
    type: String,
    required: false,
  },
  banner: {
    type: String,
    required: false,
  },
  incubator_name: {
    type: String,
    required: false,
  },
  about: {
    type: String,
    required: false,
  },
  startupStage: {
    type: String,
    required: false,
  },
  incubatorDomain: {
    type: [String],
    required: false,
  },
  skills: {
    type: [String],
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
  poc_email: {
    type: String,
    required: false,
  },
  poc_mobile: {
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

const TechPartner = mongoose.model("TechPartner", TechPartnerSchema);

module.exports = TechPartner;
