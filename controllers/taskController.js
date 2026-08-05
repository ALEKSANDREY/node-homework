const pool = require("../db/pg-pool");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

/**
 * Creates a new task associated with the active session user.
 */
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

/**
 * Retrieves all tasks associated with the authenticated user ID.
 */
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

/**
 * Retrieves a single task by task ID, enforced by ownership scope.
 */
exports.show = async (req, res, next = () => {}) => {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID parameter" });
    }

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

/**
 * Dynamically updates task fields while validating resource ownership.
 */
exports.update = async (req, res, next = () => {}) => {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID parameter" });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "Request body cannot be empty" });
    }

    const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.details ? error.details[0].message : error.message });
    }

    try {
        let keys = Object.keys(value);
        const dbKeys = keys.map((key) => (key === "isCompleted" ? "is_completed" : key));
        const setClauses = dbKeys.map((key, i) => `${key} = $${i + 1}`).join(", ");

        const values = Object.values(value);
        const idParm = `$${values.length + 1}`;
        const userParm = `$${values.length + 2}`;

        const result = await pool.query(
            `UPDATE tasks SET ${setClauses} WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`,
            [...values, taskId, global.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Task not found or unauthorized" });
        }
        return res.status(200).json(result.rows[0]);
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

/**
 * Removes a task owned by the current authenticated user.
 */
exports.deleteTask = async (req, res, next = () => {}) => {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID parameter" });
    }

    try {
        const result = await pool.query(
            "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, title, is_completed",
            [taskId, global.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Task not found or unauthorized" });
        }
        return res.status(200).json(result.rows[0]);
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};