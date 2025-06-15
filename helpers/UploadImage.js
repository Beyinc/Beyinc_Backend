const cloudinary = require('cloudinary').v2;
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });


const { CloudinaryStorage } = require("multer-storage-cloudinary"); // added for comments 
// Set up Multer storage using Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'comments', // Cloudinary folder
        allowed_formats: ['jpg', 'png', 'pdf', 'mp4'],
        public_id: (req, file) => Date.now() + '-' + file.originalname,
    },
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

module.exports = {
    cloudinary,
    storage
}