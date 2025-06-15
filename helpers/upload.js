// upload.js
const multer = require("multer");
const { storage} = require("./UploadImage"); // adjust path if needed

const upload = multer({ storage });

module.exports = upload;
