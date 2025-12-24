const mongoose = require("mongoose");


const MentorExpertiseSchema = new mongoose.Schema(
  {
    industry: {
      type: String,
      required: true,
    },
    skills: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    isProfileComplete: {
      default: false,
      type: Boolean,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    userName: {
      type: String,
      unique:false
    },
    about: {
      type: String,
    },
    headline: {
      type: String,
    },
    twitter: {
      type: String,
    },
    linkedin: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobileNumber: {
      type: String,
      // required: true,
      // unique: true,
      // sparse: true,
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
    freeDemoCode: {
      code: { type: String, unique: true },
      used: { type: Boolean, default: false },
    },

    referralCode: {
      code: { type: String, unique: true },
      used: { type: Boolean, default: false },
    },

    referredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    freeMoney: {
      type: Number,
      default: 0,
    },
    realMoney: {
      type: Number,
      default: 0,
    },
    state: { type: String },
    town: { type: String },
    country: { type: String },
    salutation: { type: String },

    experienceDetails: [
      {
        startYear: { type: String, required: false },
        endYear: { type: String, required: false },
        company: { type: String, required: false },
        designation: { type: String, required: false },
        // Profession: { type: String, required: false },
        Description: { type: String, required: false },
        CompanyLocation: { type: String, required: false },
        Banner: {
          public_id: {
            type: String,
            required: false,
          },
          secure_url: {
            type: String,
            required: false,
          },
        },
        Logo: {
          public_id: {
            type: String,
            required: false,
          },
          secure_url: {
            type: String,
            required: false,
          },
        },
      },
    ],
    educationDetails: [
      {
        Edstart: { type: String },
        Edend: { type: String },
        // year: { type: String },
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
    // Mentors/ Investores registered in beyinc
    // comment
    beyincProfile: { type: String, required: false, default: "" },
    industries: { type: [String], required: false },
    expertise: { type: [String], required: false },
    stages: { type: [String], required: false },
    investmentRange: { type: Number, required: false },

    interests: {
      type: [String],
      required: false,
      enum: [
        "Individual/Entrepreneur",
        "Startup",
        "Mentor",
        "Incubator",
        "Accelerator",
        "IndividualInvestor",
        "InstituteInvestor",
        "TradeBody",
        "GovernmentBody",
        "Corporate",
        "TechPartner",
        "",
      ],
    },

    categoryUserRole: {
      type: String,
      required: false,
      enum: [
        "Entrepreneur",
        "Individual/Entrepreneur",
        "Startup",
        "Mentor",
        "Incubator",
        "Accelerator",
        "InstituteInvestor",
        "InstituteInvestor",
        "TradeBody",
        "GovernmentBody",
        "Corporate",
        "TechPartner",
      ],
    },

    role_type: {
      type: String,
      required: false,
      enum: [
        "Entrepreneur",
        "Startup",
        "Mentor",
        "Incubator",
        "Accelerator",
        "InstituteInvestor",
        "InstituteInvestor",
        "TradeBody",
        "GovernmentBody",
        "Corporate",
        "TechPartner",
      ],
    },

    role_level: {
      type: String,
      required: false,
      enum: [
        "Entry Level",
        "Intermediate",
        "Senior / Lead",
        "Manager",
        "Director / Head",
        "VP",
        "CXO",
        "Researcher",
        "Senior Researcher / Research Lead",
        "Principal Researcher",
      ],
    },

    companyStage: {
      type: String,
      required: false,
      enum: [
        "Early Stage Startup",
        "Funded Startup",
        "Revenue Stage",
        "Established Company",
        "Enterprise",
        "",
      ],
    },

mentorExpertise: {
  type: [MentorExpertiseSchema],
  default: [],
  required: false,
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
