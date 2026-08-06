const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

// Core Task 6: Simple incrementing counter starting from 0
let taskCounter = 0;

// Helper: Remove userId from response
const sanitize = (task) => {
    if (!task) return null;
    const { userId, ...rest } = task;
    return rest;
};

// Helper: Parse ID safely
const parseTaskId = (idParam) => {
    if (idParam === undefined || idParam === null) return null;
    const num = Number(idParam);
    if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
        return null;
    }
    return num;
};

// Helper: Get user email safely
const getUserEmail = () => {
    if (!global.user_id) return null;
    if (typeof global.user_id === 'object') return global.user_id.email || null;
    if (typeof global.user_id === 'string') return global.user_id;
    return null;
};

// Helper: Check task ownership via email
const isTaskOwner = (task) => {
    const email = getUserEmail();
    if (!task || !email) return false;
    return task.userId === email;
};

// 1. Create Task (POST /api/tasks)
exports.create = async (req, res) => {
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.details ? error.details[0].message : error.message });
    }

    // Increment counter for every new task
    taskCounter += 1;

    const newTask = {
        id: taskCounter,
        userId: getUserEmail(),
        title: value.title,
        isCompleted: value.isCompleted ?? false
    };

    if (!global.tasks) global.tasks = [];
    global.tasks.push(newTask);

    return res.status(201).json(sanitize(newTask));
};

// 2. Index Tasks (GET /api/tasks)
exports.index = async (req, res) => {
    const userTasks = (global.tasks || []).filter((t) => isTaskOwner(t));

    if (userTasks.length === 0) {
        return res.status(404).json({ message: "No tasks found" });
    }

    return res.status(200).json(userTasks.map(sanitize));
};

// 3. Show Task (GET /api/tasks/:id)
exports.show = async (req, res) => {
    const taskId = parseTaskId(req.params ? req.params.id : null);
    if (!taskId) {
        return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = (global.tasks || []).find(
        (t) => Number(t.id) === taskId && isTaskOwner(t)
    );

    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json(sanitize(task));
};

// 4. Update Task (PATCH /api/tasks/:id)
exports.update = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "Request body cannot be empty" });
    }

    const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.details ? error.details[0].message : error.message });
    }

    const taskId = parseTaskId(req.params ? req.params.id : null);
    if (!taskId) {
        return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = (global.tasks || []).find(
        (t) => Number(t.id) === taskId && isTaskOwner(t)
    );

    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    Object.assign(task, value);

    return res.status(200).json(sanitize(task));
};

// 5. Delete Task (DELETE /api/tasks/:id)
exports.deleteTask = async (req, res) => {
    const taskId = parseTaskId(req.params ? req.params.id : null);
    if (!taskId) {
        return res.status(400).json({ message: "Invalid task ID" });
    }

    const index = (global.tasks || []).findIndex(
        (t) => Number(t.id) === taskId && isTaskOwner(t)
    );

    if (index === -1) {
        return res.status(404).json({ message: "Task not found" });
    }

    const [deletedTask] = global.tasks.splice(index, 1);
    return res.status(200).json(sanitize(deletedTask));
};