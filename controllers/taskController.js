const prisma = require("../db/prisma");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const getTaskId = (req) => {
    let rawId;
    if (req.params && req.params.id !== undefined) rawId = req.params.id;
    else if (req.body && req.body.id !== undefined) rawId = req.body.id;
    else if (req.id !== undefined) rawId = req.id;

    if (rawId === undefined || rawId === null) return NaN;
    const num = Number(rawId);
    if (isNaN(num) || !Number.isInteger(num) || num <= 0) return NaN;
    return num;
};

const getOrderBy = (query) => {
    const validSortFields = ["title", "priority", "createdAt", "id", "isCompleted"];
    const sortBy = query.sortBy || "createdAt";
    const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";

    if (validSortFields.includes(sortBy)) {
        return { [sortBy]: sortDirection };
    }
    return { createdAt: "desc" };
};

exports.index = async (req, res, next = () => {}) => {
    try {
        const userId = parseInt(req.user.id, 10);
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        // Exclude soft-deleted tasks from all index queries
        const whereClause = {
            userId,
            deletedAt: null,
        };

        if (req.query.find) {
            whereClause.title = {
                contains: req.query.find,
                mode: "insensitive",
            };
        }

        if (req.query.isCompleted !== undefined) {
            whereClause.isCompleted = req.query.isCompleted === "true";
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: getOrderBy(req.query),
        });

        if (!tasks || tasks.length === 0) {
            return res.status(404).json({ message: "No tasks found" });
        }

        const totalTasks = await prisma.task.count({ where: whereClause });

        const pagination = {
            page,
            limit,
            total: totalTasks,
            pages: Math.ceil(totalTasks / limit) || 1,
            hasNext: page * limit < totalTasks,
            hasPrev: page > 1,
        };

        return res.status(200).json({ tasks, pagination });
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.create = async (req, res, next = () => {}) => {
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            message: error.details ? error.details[0].message : error.message,
            error: "Validation failed",
        });
    }

    try {
        const userId = parseInt(req.user.id, 10);
        const task = await prisma.task.create({
            data: {
                title: value.title,
                isCompleted: value.isCompleted ?? false,
                priority: value.priority || "medium",
                userId: userId,
            },
            select: { id: true, title: true, isCompleted: true, priority: true, createdAt: true },
        });
        return res.status(201).json(task);
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.bulkCreate = async (req, res, next = () => {}) => {
    const { tasks } = req.body || {};

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: "Invalid request data. Expected an array of tasks." });
    }

    const userId = parseInt(req.user.id, 10);
    const validTasks = [];

    for (const task of tasks) {
        const { error, value } = taskSchema.validate(task);
        if (error) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.details,
            });
        }
        validTasks.push({
            title: value.title,
            isCompleted: value.isCompleted || false,
            priority: value.priority || "medium",
            userId: userId,
        });
    }

    try {
        const result = await prisma.task.createMany({
            data: validTasks,
            skipDuplicates: false,
        });

        return res.status(201).json({
            message: "Bulk task creation successful",
            tasksCreated: result.count,
            totalRequested: validTasks.length,
        });
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
        const userId = parseInt(req.user.id, 10);
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                userId,
                deletedAt: null, // Exclude soft-deleted tasks
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
                createdAt: true,
                user: {
                    select: { name: true, email: true },
                },
            },
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        return res.status(200).json(task);
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
        const userId = parseInt(req.user.id, 10);

        // Ensure task exists and is not soft-deleted before updating
        const existingTask = await prisma.task.findFirst({
            where: { id: taskId, userId, deletedAt: null },
        });

        if (!existingTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        const task = await prisma.task.update({
            where: {
                id_userId: {
                    id: taskId,
                    userId: userId,
                },
            },
            data: value,
            select: { id: true, title: true, isCompleted: true, priority: true, createdAt: true },
        });

        return res.status(200).json(task);
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
        const userId = parseInt(req.user.id, 10);

        // 1. Check if task exists and has not already been soft-deleted
        const existingTask = await prisma.task.findFirst({
            where: {
                id: taskId,
                userId,
                deletedAt: null,
            },
        });

        if (!existingTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        // 2. Perform soft delete by setting deletedAt to now
        const task = await prisma.task.update({
            where: {
                id_userId: {
                    id: taskId,
                    userId: userId,
                },
            },
            data: {
                deletedAt: new Date(),
            },
        });

        return res.status(200).json(task);
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ message: "Task not found" });
        }
        if (typeof next === "function") return next(err);
    }
};