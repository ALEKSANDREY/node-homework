const express = require('express');
const app = express();

const userRouter = require('./routes/userRoutes');
const taskRouter = require('./routes/taskRoutes');
const authMiddleware = require('./middleware/auth');
// Match exact file names in middleware/ directory:
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

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