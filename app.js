const express = require('express');
const app = express();

const userRouter = require('./routes/userRoutes');
const taskRouter = require('./routes/taskRoutes');
const authMiddleware = require('./middleware/auth');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorHandlerMiddleware = require('./middleware/errorHandlerMiddleware');

app.use(express.json());

// 1. PUBLIC ROUTES & PROTECTED TASK ROUTES
app.use('/api/users', userRouter);
app.use('/api/tasks', authMiddleware, taskRouter);

// 2. ERROR HANDLERS
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

module.exports = app;