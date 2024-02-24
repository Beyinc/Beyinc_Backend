const mongoose = require('mongoose');

const userApprovalSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true
    },
    userInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        type: String
    },
    state: { type: String },
    town: { type: String },
    country: { type: String },
    skills: { type: Array },
    languagesKnown: { type: Array },

    role: {
        type: String
    },
    verification: {
        type: String
    },
    experienceDetails: [{
        domain: { type: String },
        start: { type: String },
        end: { type: String },
        year: {type: String},
        company: {type: String},
        profession: {type: String},
    }],
    educationDetails: [{
        Edstart: { type: String },
        Edend: { type: String },
        year: {type: String},
        grade: {type: String},
        college: {type: String},
    }],
    fee: {
        type: String
    }, bio: {
        type: String
    },
    documents: {

        resume: {
            public_id: {
                type: String
            },
            secure_url: {
                type: String
            }
        },


        acheivements: {
            public_id: {
                type: String
            },
            secure_url: {
                type: String
            }
        },

        degree: {
            public_id: {
                type: String
            },
            secure_url: {
                type: String
            }
        },

        expertise: {
            public_id: {
                type: String
            },
            secure_url: {
                type: String
            }

        },

        working: {
            public_id: {
                type: String
            },
            secure_url: {
                type: String
            }
        }
    }
}, {
    timestamps: true  // This adds 'createdAt' and 'updatedAt' fields
})

const UserUpdate = new mongoose.model('UserUpdateApproval', userApprovalSchema)
module.exports = UserUpdate;