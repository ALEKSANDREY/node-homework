const Joi = require('joi');

const userSchema = Joi.object({
    name: Joi.string().trim().min(3).max(30).required(),
    email: Joi.string().email().trim().lowercase().required(),
    password: Joi.string()
        .min(8)
        .max(30)
        .invalid("password", "123456", "qwerty")
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
});

module.exports = {
    userSchema
};