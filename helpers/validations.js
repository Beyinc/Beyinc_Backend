const joi = require('@hapi/joi')

const authSchema = joi.object({
    userName: joi.string(),
    email: joi.string().email(),
    password: joi.string().min(2),
    phone: joi.string().min(10),
    role: joi.string(),
    image: joi.string(),
    type: joi.string(),
})

module.exports={
    authSchema
}