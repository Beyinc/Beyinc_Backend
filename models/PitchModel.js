const mongoose = require('mongoose');

const pitchSchema = new mongoose.Schema({
    email: {
        type: String
    }, userInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // profile_pic: {
    //     type: String
    // }, userName: {
    //     type: String
    // },
    userType: {type: String},
    // state: { type: String },
    // town: { type: String },
    // country: { type: String },
    // role: {
    //     type: String
    // },
    website: {
        type: String
    },
    teamOverview: {
        type: String
    },
    businessModel: {
        type: String
    },
    revenueModel: { type: String },
    memberscountry: {
        type: String
    },
    industry1: {
        type: String
    },
    industry2: {
        type: String
    },
    // userColleges: {type: Array},
    idealInvestor: {
        type: String
    },
    industry1: {
        type: String
    },
    targetMarket: {
        type: String
    },
    targetUsers: {
        type: String
    },
    usp: {
        type: String
    },
    minimumInvestment: {
        type: String
    },
    objectives: {
        type: String
    },
    previousRoundRaise: {
        type: String
    },
    progress: {
        type: String
    },
    raised: {
        type: String
    },
    raising: {
        type: String
    },
    overViewOfStartup: {
        type: String
    }, competitorAnalysis: { type: String },
    stage: {
        type: String
    },
    tags: {
        type: Array
    },
    title: {
        type: String
    },
    heading: {
        type: String
    },
    description: {
        type: String
    },
    hiringPositions: {
        type: Array
    },
    pitchRequiredStatus: {
        type: String
    },
    status: {
        type: String
    },
    associatedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    pitch: {
        public_id: {
            type: String
        },
        secure_url: {
            type: String
        }
    },
    logo: {
        public_id: {
            type: String
        },
        secure_url: {
            type: String
        }
    },
    banner: {
        public_id: {
            type: String
        },
        secure_url: {
            type: String
        }
    }, financials: {
        public_id: {
            type: String
        },
        secure_url: {
            type: String
        }
    },
    teamMembers: [{
        memberPic: {
            public_id: {
                type: String
            },
            secure_url: {
                type: String
            }
        },
        name: {
            type: String
        },
        position: {
            type: String
        },
        socialLink: {
            type: String
        },
        bio: {
            type: String
        }
    }],
    intrest: [{
        intrestBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        email: {
            type: String
        },
        // userName: {
        //     type: String
        // }, profile_pic: {
        //     type: String
        // },
        createdAt: {
            type: Date
        }

    }],
    review: [{
        reviewBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        email: {
            type: String
        },
        review: {
            type: Number
        },
        createdAt: {
            type: Date
        }

    }]
}, {
    timestamps: true  // This adds 'createdAt' and 'updatedAt' fields
})

const Pitch = new mongoose.model('Pitch', pitchSchema)
module.exports = Pitch;