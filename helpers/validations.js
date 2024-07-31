const joi = require('@hapi/joi')
// dumm
const authSchema = joi.object({
    userName: joi.string(),
    email: joi.string().email(),
    password: joi.string().min(2),
    role: joi.string(),
    image: joi.string(),
    type: joi.string(),
})

module.exports={
    authSchema
}