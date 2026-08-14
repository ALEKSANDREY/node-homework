const prisma = require("../db/prisma");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const getTaskId = (req) => {
    let rawId;
    if (req.params && req.params.id !== undefined) rawId = req.params.id;
    else if (req.body && req.body.id !== undefined) rawId = req.body.id;
    else if (req.id !== undefined) rawId = req.id;

    if (rawId === undefined || rawId === null) return NaN;
    const num = Number(rawId);
    if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
        return NaN;
    }
    return num;
};

const formatTask = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        title: row.title,
        isCompleted: row.isCompleted,
        is_completed: row.isCompleted
    };
};

exports.create = async (req, res, next = () => {}) => {
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.details ? error.details[0].message : error.message });
    }

    try {
        const userId = parseInt(global.user_id, 10);
        const task = await prisma.task.create({
            data: {
                title: value.title,
                isCompleted: value.isCompleted ?? false,
                userId: userId
            },
            select: { id: true, title: true, isCompleted: true }
        });
        return res.status(201).json(formatTask(task));
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.index = async (req, res, next = () => {}) => {
    try {
        const userId = parseInt(global.user_id, 10);
        const tasks = await prisma.task.findMany({
            where: { userId: userId },
            select: { id: true, title: true, isCompleted: true }
        });

        if (tasks.length === 0) {
            return res.status(404).json({ message: "No tasks found" });
        }
        return res.status(200).json(tasks.map(formatTask));
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.show = async (req, res, next = () => {}) => {
    const taskId = getTaskId(req);
    if (isNaN(taskId)) {
        return res.status(404).json({ message: "Task not found" });
    }

    try {
        const userId = parseInt(global.user_id, 10);
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                userId: userId
            },
            select: { id: true, title: true, isCompleted: true }
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        return res.status(200).json(formatTask(task));
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.update = async (req, res, next = () => {}) => {
    const taskId = getTaskId(req);
    if (isNaN(taskId)) {
        return res.status(404).json({ message: "Task not found" });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "Request body cannot be empty" });
    }

    const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.details ? error.details[0].message : error.message });
    }

    try {
        const userId = parseInt(global.user_id, 10);

        const task = await prisma.task.update({
            where: {
                id_userId: {
                    id: taskId,
                    userId: userId
                }
            },
            data: value,
            select: { id: true, title: true, isCompleted: true }
        });

        return res.status(200).json(formatTask(task));
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ message: "Task not found" });
        }
        if (typeof next === "function") return next(err);
    }
};

exports.deleteTask = async (req, res, next = () => {}) => {
    const taskId = getTaskId(req);
    if (isNaN(taskId)) {
        return res.status(404).json({ message: "Task not found" });
    }

    try {
        const userId = parseInt(global.user_id, 10);

        const task = await prisma.task.delete({
            where: {
                id_userId: {
                    id: taskId,
                    userId: userId
                }
            },
            select: { id: true, title: true, isCompleted: true }
        });

        return res.status(200).json(formatTask(task));
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ message: "Task not found" });
        }
        if (typeof next === "function") return next(err);
    }
};