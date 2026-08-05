const Joi = require('joi');

const taskSchema = Joi.object({
    title: Joi.string().trim().min(3).max(30).required(),
    isCompleted: Joi.boolean().invalid(null).default(false)
});

const patchTaskSchema = Joi.object({
    title: Joi.string().trim().min(3).max(30).optional(),
    isCompleted: Joi.boolean().invalid(null).optional()
}).min(1);

module.exports = {
    taskSchema,
    patchTaskSchema
};