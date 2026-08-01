const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

// Dedicated helper required by assignment spec
const taskCounter = () => {
    const tasks = global.tasks || [];
    if (tasks.length === 0) return 1;
    return Math.max(...tasks.map(t => Number(t.id) || 0)) + 1;
};

// Helper: Remove userId from API responses
const sanitize = (task) => {
    if (!task) return null;
    const { userId, ...rest } = task;
    return rest;
};

// Helper: Validate task ID from params (accepts positive integers or numeric strings)
const parseTaskId = (idParam) => {
    if (idParam === undefined || idParam === null) return null;
    const num = Number(idParam);
    if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
        return null;
    }
    return num;
};

// Helper: Strict task ownership check using global.user_id.email
const isTaskOwner = (task) => {
    if (!task || !global.user_id || !global.user_id.email) {
        return false;
    }
    return task.userId === global.user_id.email;
};

// 1. Create Task
exports.create = async (req, res) => {
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.details ? error.details[0].message : error.message });
    }

    const newTask = {
        id: taskCounter(),
        userId: global.user_id ? global.user_id.email : null,
        title: value.title,
        isCompleted: value.isCompleted ?? false
    };

    if (!global.tasks) global.tasks = [];
    global.tasks.push(newTask);
    return res.status(201).json(sanitize(newTask));
};

// 2. Index Tasks
exports.index = async (req, res) => {
    const userTasks = (global.tasks || []).filter((t) => isTaskOwner(t));

    if (userTasks.length === 0) {
        return res.status(404).json({ message: "No tasks found" });
    }

    return res.status(200).json(userTasks.map(sanitize));
};

// 3. Show Task
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

// 4. Update Task (PATCH)
exports.update = async (req, res) => {
    if (!req.body) req.body = {};

    const schemaToUse = patchTaskSchema || taskSchema;
    const { error, value } = schemaToUse.validate(req.body, { abortEarly: false });
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

// 5. Delete Task
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