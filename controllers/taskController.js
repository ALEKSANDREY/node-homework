const pool = require("../db/pg-pool");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const getTaskId = (req) => {
    if (req.params && req.params.id !== undefined) return parseInt(req.params.id, 10);
    if (req.body && req.body.id !== undefined) return parseInt(req.body.id, 10);
    if (req.id !== undefined) return parseInt(req.id, 10);
    return NaN;
};

exports.create = async (req, res, next = () => {}) => {
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.details ? error.details[0].message : error.message });
    }

    try {
        const result = await pool.query(
            `INSERT INTO tasks (title, is_completed, user_id) VALUES ($1, $2, $3) RETURNING id, title, is_completed`,
            [value.title, value.isCompleted ?? false, global.user_id]
        );
        return res.status(201).json(result.rows[0]);
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.index = async (req, res, next = () => {}) => {
    try {
        const result = await pool.query(
            "SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
            [global.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No tasks found" });
        }
        return res.status(200).json(result.rows);
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.show = async (req, res, next = () => {}) => {
    const taskId = getTaskId(req);

    try {
        const result = await pool.query(
            "SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2",
            [taskId, global.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }
        return res.status(200).json(result.rows[0]);
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.update = async (req, res, next = () => {}) => {
    const taskId = getTaskId(req);

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "Request body cannot be empty" });
    }

    const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.details ? error.details[0].message : error.message });
    }

    try {
        const existing = await pool.query(
            "SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2",
            [taskId, global.user_id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        const currentTask = existing.rows[0];
        const updatedTitle = value.title !== undefined ? value.title : currentTask.title;
        const updatedCompleted = value.isCompleted !== undefined ? value.isCompleted : currentTask.is_completed;

        const result = await pool.query(
            "UPDATE tasks SET title = $1, is_completed = $2 WHERE id = $3 AND user_id = $4 RETURNING id, title, is_completed",
            [updatedTitle, updatedCompleted, taskId, global.user_id]
        );

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.deleteTask = async (req, res, next = () => {}) => {
    const taskId = getTaskId(req);

    try {
        const result = await pool.query(
            "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, title, is_completed",
            [taskId, global.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }
        return res.status(200).json(result.rows[0]);
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};