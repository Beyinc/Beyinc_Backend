const mongoose = require('mongoose');

const rolesSchema = new mongoose.Schema({
    role: {
        type: String,
        unique: true
    }
}, {
    timestamps: true  // This adds 'createdAt' and 'updatedAt' fields
})

const Roles = new mongoose.model('Roles', rolesSchema)
module.exports = Roles;