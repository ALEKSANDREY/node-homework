// controllers/taskController.js
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

// Task ID Counter Helper
const taskCounter = (() => {
    let lastTaskNumber = 0;
    return () => {
        lastTaskNumber += 1;
        return lastTaskNumber;
    };
})();

// Helper to remove userId from responses
const sanitize = (task) => {
    const { userId, ...sanitizedTask } = task;
    return sanitizedTask;
};

// 1. Create Task
exports.create = async (req, res) => {
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.message });
    }

    const newTask = {
        id: taskCounter(),
        userId: global.user_id.email,
        ...value,
    };

    global.tasks.push(newTask);
    res.status(201).json(sanitize(newTask));
};

// 2. Index (List all tasks for current user)
exports.index = async (req, res) => {
    const userTasks = global.tasks.filter(
        (task) => task.userId === global.user_id.email
    );

    if (userTasks.length === 0) {
        return res.status(404).json({ message: "No tasks found" });
    }

    const sanitizedTasks = userTasks.map(sanitize);
    res.status(200).json(sanitizedTasks);
};

// 3. Show (Get single task by ID)
exports.show = async (req, res) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) {
        return res.status(400).json({ message: "The task ID passed is not valid." });
    }

    const task = global.tasks.find(
        (t) => t.id === taskId && t.userId === global.user_id.email
    );

    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(sanitize(task));
};

// 4. Update Task (PATCH)
exports.update = async (req, res) => {
    if (!req.body) req.body = {};

    const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.message });
    }

    const taskId = parseInt(req.params?.id);
    if (!taskId) {
        return res.status(400).json({ message: "The task ID passed is not valid." });
    }

    const task = global.tasks.find(
        (t) => t.id === taskId && t.userId === global.user_id.email
    );

    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    Object.assign(task, value);
    res.status(200).json(sanitize(task));
};

// 5. Delete Task
exports.deleteTask = async (req, res) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) {
        return res.status(400).json({ message: "The task ID passed is not valid." });
    }

    const index = global.tasks.findIndex(
        (t) => t.id === taskId && t.userId === global.user_id.email
    );

    if (index === -1) {
        return res.status(404).json({ message: "Task not found" });
    }

    const [deletedTask] = global.tasks.splice(index, 1);
    res.status(200).json(sanitize(deletedTask));
};