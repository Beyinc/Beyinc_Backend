const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    isProfileComplete: {
      default: false,
      type: Boolean,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
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
    password: {
      type: String,
      required: true,
    },
    image: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    banner: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    role: {
      type: String,
    },
    verification: {
      type: String,
    },
    freeCoins: {
      type: String,
    },
    state: { type: String },
    town: { type: String },
    country: { type: String },
    salutation: { type: String },
    payment: [
      {
        email: {
          type: String,
        },
        profile_pic: {
          type: String,
        },
        userName: {
          type: String,
        },
        role: {
          type: String,
        },
        moneyPaid: {
          type: Number,
        },
        noOfTimes: {
          type: Number,
        },
        createdAt: {
          type: Date,
        },
      },
    ],

    realCoins: {
      type: String,
    },
    experienceDetails: [
      {
        domain: { type: String },
        institute: { type: String },
        start: { type: String },
        end: { type: String },
        year: { type: String },
        company: { type: String },
        areaOfBusiness: { type: String },
        profession: { type: String },
        designation: { type: String },
        Achievements: { type: String, required: false },
        Published: { type: String, required: false },
        StartupExperience: { type: String, required: false },
        Consultancy: { type: String, required: false },
        Profession: { type: String, required: false },
        TotalWorkExperience: { type: String, required: false },
        Description: { type: String, required: false },
        Customers: { type: String, required: false },
        CompanyLocation: { type: String, required: false },
        Banner: {
          public_id: {
            type: String,
          },
          secure_url: {
            type: String,
          },
        },
        Logo: {
          public_id: {
            type: String,
          },
          secure_url: {
            type: String,
          },
        },
        Services: { type: String, required: false },
        startupName: { type: String, required: false },
        workingStatus: { type: String, required: false },
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
    mentorCategories: {
      type: String,
      required: false,
    },
    fee: {
      type: String,
    },
    bio: {
      type: String,
    },
    role_details: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "role_type",
      required: false,
    },
    role_type: {
      type: String,
      required: false,
      enum: [
        "Individual/Entrepreneur",
        "Startup",
        "Mentor",
        "Incubator",
        "Accelerator",
        "Individual Investor",
        "Institutional Investor",
        "Trade Bodies",
        "Government Body",
        "Corporate",
        "Technology Partner",
      ],
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
    review: [
      {
        reviewBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        review: {
          type: Number,
        },
        createdAt: {
          type: Date,
        },
      },
    ],
    skills: { type: Array },
    languagesKnown: { type: Array },
    chatBlock: [
      {
        userInfo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
        },
      },
    ],
    chatBlockedBy: [
      {
        userInfo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
        },
      },
    ],
    //new keys
    selectedDate: { type: String, required: false },
    selectedProfile: { type: String, required: false },
    selectedTime: { type: String, required: false },
    selectedOneToOne: { type: String, required: false },
    selectedBecomePlatform: { type: String, required: false },
    selectedDropdownPrimary: { type: String, required: false },
    selectedDropdownSecondary: { type: String, required: false },
    selectedTypes: [{ type: String, required: false }],
    selectedDomains: [{ type: String, required: false }],
  },
  {
    timestamps: true, // This adds 'createdAt' and 'updatedAt' fields
  }
);

const User = new mongoose.model("User", userSchema);
module.exports = User;
