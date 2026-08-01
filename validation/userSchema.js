const Joi = require('joi');

const userSchema = Joi.object({
    name: Joi.string().trim().min(3).max(30).required(),
    email: Joi.string().email().trim().lowercase().required(),
    // Enforces min length and prevents trivial passwords (requires letters + numbers or min length 8)
    password: Joi.string().min(8).max(30).regex(/^(?=.*[a-zA-Z])(?=.*\d)/).required()
});

module.exports = {
    userSchema
};