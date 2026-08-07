const pool = require("../db/pg-pool");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const getTaskId = (req) => {
    if (req.params && req.params.id !== undefined) return parseInt(req.params.id, 10);
    if (req.body && req.body.id !== undefined) return parseInt(req.body.id, 10);
    if (req.id !== undefined) return parseInt(req.id, 10);
    return NaN;
};

// Map DB row to Task object shape
const formatTask = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        title: row.title,
        isCompleted: row.is_completed
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
        const result = await pool.query(
            `INSERT INTO tasks (title, is_completed, user_id) VALUES ($1, $2, $3) RETURNING id, title, is_completed`,
            [value.title, value.isCompleted ?? false, userId]
        );
        return res.status(201).json(formatTask(result.rows[0]));
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.index = async (req, res, next = () => {}) => {
    try {
        const userId = parseInt(global.user_id, 10);
        const result = await pool.query(
            "SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
            [userId]
        );

        return res.status(200).json(result.rows.map(formatTask));
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.show = async (req, res, next = () => {}) => {
    const taskId = getTaskId(req);

    try {
        const userId = parseInt(global.user_id, 10);
        const result = await pool.query(
            "SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2",
            [taskId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }
        return res.status(200).json(formatTask(result.rows[0]));
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
        const userId = parseInt(global.user_id, 10);

        // Single update query with dynamic field assignment filtered by taskId and userId
        const fields = [];
        const values = [];
        let index = 1;

        if (value.title !== undefined) {
            fields.push(`title = $${index++}`);
            values.push(value.title);
        }
        if (value.isCompleted !== undefined) {
            fields.push(`is_completed = $${index++}`);
            values.push(value.isCompleted);
        }

        values.push(taskId, userId);
        const queryText = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${index++} AND user_id = $${index++} RETURNING id, title, is_completed`;

        const result = await pool.query(queryText, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        return res.status(200).json(formatTask(result.rows[0]));
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.deleteTask = async (req, res, next = () => {}) => {
    const taskId = getTaskId(req);

    try {
        const userId = parseInt(global.user_id, 10);
        const result = await pool.query(
            "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, title, is_completed",
            [taskId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }
        return res.status(200).json(formatTask(result.rows[0]));
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};