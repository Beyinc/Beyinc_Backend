const crypto = require('crypto');

function generateUniqueCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

exports.generateUniqueCode = generateUniqueCode;
