const Joi = require('joi');

const taskSchema = Joi.object({
    title: Joi.string().min(3).max(30).required(),
    description: Joi.string().allow('').optional(),
    isCompleted: Joi.boolean().default(false).invalid(null)
});

const patchTaskSchema = Joi.object({
    title: Joi.string().min(3).max(30).optional(),
    description: Joi.string().allow('').optional(),
    isCompleted: Joi.boolean().invalid(null).optional()
}).min(1);

module.exports = {
    taskSchema,
    patchTaskSchema
};