const express = require("express");
const router = express.Router();
const rolesController = require("../controllers/rolesController");

router.route('/getAllRoles').get(rolesController.getAllRoles)
router.route('/addRole').post(rolesController.addrole)
router.route('/deleteRole').post(rolesController.deleteRole)





module.exports = router;