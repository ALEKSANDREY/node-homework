const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const sanitize = (task) => {
    if (!task) return null;
    const { userId, ...rest } = task;
    return rest;
};

const parseTaskId = (idParam) => {
    if (idParam === undefined || idParam === null) return null;
    const num = Number(idParam);
    if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
        return null;
    }
    return num;
};

// Robust Ownership check: checks email first (AirHub requirement), then falls back to ID matching
const isTaskOwner = (task) => {
    if (!task || !global.user_id) return false;

    const currentUserEmail = typeof global.user_id === 'object' ? global.user_id.email : null;
    const currentUserId = typeof global.user_id === 'object' ? global.user_id.id : global.user_id;

    if (task.userId && currentUserEmail && task.userId === currentUserEmail) {
        return true;
    }
    if (task.userId && currentUserId && String(task.userId) === String(currentUserId)) {
        return true;
    }

    return false; // Strictly NO missing userId fallback!
};

exports.create = async (req, res) => {
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.message });
    }

    const tasksList = global.tasks || [];
    const nextId =
        tasksList.length > 0
            ? Math.max(...tasksList.map((t) => Number(t.id) || 0)) + 1
            : 1;

    // Assign user email if object, otherwise fallback to global.user_id
    const assignedUserId = (global.user_id && global.user_id.email)
        ? global.user_id.email
        : global.user_id;

    const newTask = {
        id: nextId,
        userId: assignedUserId,
        ...value,
    };

    if (!global.tasks) global.tasks = [];
    global.tasks.push(newTask);
    return res.status(201).json(sanitize(newTask));
};

exports.index = async (req, res) => {
    const userTasks = (global.tasks || []).filter((t) => isTaskOwner(t));

    if (userTasks.length === 0) {
        return res.status(404).json({ message: "No tasks found" });
    }

    return res.status(200).json(userTasks.map(sanitize));
};

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

exports.update = async (req, res) => {
    if (!req.body) req.body = {};

    const { error, value } = patchTaskSchema.validate(req.body, {
        abortEarly: false,
    });
    if (error) {
        return res.status(400).json({ message: error.message });
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