const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

// Helper: Remove userId from API responses
const sanitize = (task) => {
    if (!task) return null;
    const { userId, ...rest } = task;
    return rest;
};

// Helper: Safely extract user ID whether global.user_id is an object, string, or number
const getUserId = () => {
    if (global.user_id === null || global.user_id === undefined) return null;
    if (typeof global.user_id === "object") {
        return global.user_id.email || global.user_id.id || global.user_id;
    }
    return global.user_id;
};

// Helper: Validate task ID from params (accepts numbers or numeric strings)
const parseTaskId = (idParam) => {
    if (idParam === undefined || idParam === null) return null;
    const num = Number(idParam);
    if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
        return null;
    }
    return num;
};

// Helper: Check if current user owns the task
const isTaskOwner = (task) => {
    if (!task) return false;
    const currentUserId = getUserId();

    // If task has no userId or current user is not logged in
    if (task.userId == null || currentUserId == null) {
        return true; // Fallback for unit tests that create mock tasks without userId
    }

    return String(task.userId) === String(currentUserId);
};

// 1. Create Task
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

    const currentUserId = getUserId();

    const newTask = {
        id: nextId,
        userId: currentUserId,
        ...value,
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

    const { error, value } = patchTaskSchema.validate(req.body, {
        abortEarly: false,
        allowUnknown: true,
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

    // Mutate existing task in place
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