const Roles = require("../models/RoleModel.js")

exports.getAllRoles = async (req, res, next) => {
    try {
        const roles = await Roles.find()
        return res.status(200).send(roles)
    } catch (err) {
        return res.status(400).send(err)

   }
}


exports.addrole = async (req, res, next) => {
    try {
        const { role } = req.body
        const roleExist = await Roles.findOne({role: role})
        if (role == undefined || roleExist) {
            throw new Error
        }
        await Roles.create({role: role})
        return res.status(200).send('Role Added')
    } catch (err) {
        return res.status(400).send(err)

    }
}

exports.deleteRole = async (req, res, next) => {
    try {
        const { roleId } = req.body
        await Roles.deleteOne({ _id: roleId })
        return res.status(200).send('Role deleted')
    } catch (err) {
        return res.status(400).send(err)

    }
}