const express = require("express");

const { applyReferral,
    getCouponsForUser, updateCouponStatus} = require("../controllers/referralController");

const router = express.Router();




router.route("/applyReferral").post(applyReferral);
router.route('/getCoupons').post(getCouponsForUser);
router.route('/updateCoupon').post(updateCouponStatus);


module.exports = router;
