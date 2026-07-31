const Joi = require("joi");

const taskSchema = Joi.object({
    title: Joi.string().trim().min(3).max(30).required(),
    isCompleted: Joi.boolean().default(false),
});

const patchTaskSchema = Joi.object({
    title: Joi.string().trim().min(3).max(30).optional(),
    isCompleted: Joi.boolean().optional(),
}).min(1);

module.exports = {
    taskSchema,
    patchTaskSchema,
};