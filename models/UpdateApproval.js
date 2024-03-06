const mongoose = require("mongoose");

const userApprovalSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    userInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
    },
    state: { type: String },
    town: { type: String },
    country: { type: String },
    skills: { type: Array },
    languagesKnown: { type: Array },
    mentorCategories: {
      type: String,
      required: false,
    },
    role: {
      type: String,
    },
    verification: {
      type: String,
    },
    salutation: { type: String, required: false },
    experienceDetails: [
      {
        domain: { type: String },
        start: { type: String },
        end: { type: String },
        year: { type: String },
        company: { type: String },
        profession: { type: String },
        Achievements: { type: String, required: false },
        Published: { type: String, required: false },
        StartupExperience: { type: String, required: false },
        Consultancy: { type: String, required: false },
        Profession: { type: String, required: false },
        TotalWorkExperience: { type: String, required: false },
        Description: { type: String, required: false },
        Customers: { type: String, required: false },
        CompanyLocation: { type: String, required: false },
        Banner: { type: String, required: false },
        Logo: { type: String, required: false },
        Services: { type: String, required: false },
      },
    ],
    educationDetails: [
      {
        Edstart: { type: String },
        Edend: { type: String },
        year: { type: String },
        grade: { type: String },
        college: { type: String },
      },
    ],
    fee: {
      type: String,
    },
    bio: {
      type: String,
    },
    documents: {
      resume: {
        public_id: {
          type: String,
        },
        secure_url: {
          type: String,
        },
      },

      acheivements: {
        public_id: {
          type: String,
        },
        secure_url: {
          type: String,
        },
      },

      degree: {
        public_id: {
          type: String,
        },
        secure_url: {
          type: String,
        },
      },

      expertise: {
        public_id: {
          type: String,
        },
        secure_url: {
          type: String,
        },
      },

      working: {
        public_id: {
          type: String,
        },
        secure_url: {
          type: String,
        },
      },
    },
  },
  {
    timestamps: true, // This adds 'createdAt' and 'updatedAt' fields
  }
);

const UserUpdate = new mongoose.model("UserUpdateApproval", userApprovalSchema);
module.exports = UserUpdate;
