const express = require('express');
const app = express();

const userRouter = require('./routes/userRoutes');
const taskRouter = require('./routes/taskRoutes');
const authMiddleware = require('./middleware/auth');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorHandlerMiddleware = require('./middleware/errorHandlerMiddleware');

// Initialize globals explicitly at the top of app.js
global.users = global.users || [];
global.tasks = global.tasks || [];
global.user_id = global.user_id || null;

app.use(express.json());

// Public User Routes
app.use('/api/users', userRouter);

// Protected Task Routes
app.use('/api/tasks', authMiddleware, taskRouter);

// Error Middlewares
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

module.exports = app;