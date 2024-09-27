const express = require("express");

const { applyReferral,
    getCouponsForUser} = require("../controllers/referralController");

const router = express.Router();




router.route("/applyReferral").post(applyReferral);
router.route('/coupons').get(getCouponsForUser);

module.exports = router;
