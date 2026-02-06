const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Operations related to users
 * /api/userDetails/getUser:
 *   post:
 *     summary: get User Profile based on email
 *     description: get User Profile based on email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user.
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: User based on the email
 *       400:
 *         description: Invalid request payload
 
 
 
 * /api/userDetails/getUsers:
 *   post:
 *     summary: get All users
 *     description: get All users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: The name of the user.
 *             required:
 *               - type
 *     responses:
 *       200:
 *         description: Users based on the type
 *       400:
 *         description: Invalid request payload
 */
//


router.route("/removeFollower").post(userController.removeFollower);





// Temporary test route - uploads provided base64 images to Cloudinary and returns normalized results
const cloudinary = require('cloudinary').v2;
router.post('/testUpload', async (req, res) => {
  try {
    const { images = [], createdBy = { email: 'test' } } = req.body;
    if (!images || !images.length) return res.status(400).json({ message: 'No images provided' });
    const uploaded = await Promise.all(
      images.map((img) => cloudinary.uploader.upload(img, { folder: `${createdBy.email}/test` }))
    );
    const normalized = uploaded.map((u) => ({ public_id: u.public_id, url: u.secure_url || u.url }));
    return res.status(200).json({ uploaded: normalized });
  } catch (err) {
    console.error('testUpload error', err);
    return res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

module.exports = router;
