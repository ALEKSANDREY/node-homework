const Joi = require("joi");

const taskSchema = Joi.object({
    title: Joi.string().required(),
    isCompleted: Joi.boolean().default(false),
    priority: Joi.string().valid("low", "medium", "high").default("medium"),
});

const patchTaskSchema = Joi.object({
    title: Joi.string(),
    isCompleted: Joi.boolean(),
    priority: Joi.string().valid("low", "medium", "high"),
}).min(1);

module.exports = {
    taskSchema,
    patchTaskSchema,
};