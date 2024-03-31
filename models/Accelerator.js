const mongoose = require("mongoose");

const AcceleratorSchema = new mongoose.Schema({
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
  successStories: {
    type: String,
    required: false,
  },
  isVacancyAvaliable: {
    type: String,
    enum: ["yes", "no"],
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  vacancyFile: {
    type: String,
    required: false,
  },
  poc_name: {
    type: String,
    required: false,
  },
  poc_mobile: {
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
  isSEBI: {
    type: String,
    enum: ["yes", "no"],
    required: false,
  },
  startupDate: {
    type: Date,
    required: false,
  },
  programDuration: {
    type: String,
    required: false,
  },
  currentAcceleratees: {
    type: String,
    required: false,
  },
  incubator_name: {
    type: String,
    required: false,
  },
  incubatorEstablishmentDate: {
    type: Date,
    required: false,
  },
  about: {
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
  graduatedIncubatees: {
    type: String,
    required: false,
  },
});

const Accelerator = mongoose.model("Accelerator", AcceleratorSchema);

module.exports = Accelerator;
