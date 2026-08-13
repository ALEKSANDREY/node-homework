const pool = require("../db/pg-pool");
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
        isCompleted: row.is_completed,
        is_completed: row.is_completed
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

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No tasks found" });
        }
        return res.status(200).json(result.rows.map(formatTask));
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

        let keys = Object.keys(value);
        keys = keys.map((key) => key === "isCompleted" ? "is_completed" : key);
        const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
        const idParm = `$${keys.length + 1}`;
        const userParm = `$${keys.length + 2}`;

        const queryText = `UPDATE tasks SET ${setClauses} WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`;
        const queryValues = [...Object.values(value), taskId, userId];

        const result = await pool.query(queryText, queryValues);

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
    if (isNaN(taskId)) {
        return res.status(404).json({ message: "Task not found" });
    }

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