const mongoose = require('mongoose');

const userVerify = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    verifyToken: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true  // This adds 'createdAt' and 'updatedAt' fields
})

const Userverify = new mongoose.model('Userverify', userVerify)
module.exports =  Userverify;