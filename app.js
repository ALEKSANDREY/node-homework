const express = require('express');
const app = express();

const userRouter = require('./routes/userRoutes');
const taskRouter = require('./routes/taskRoutes');
const authMiddleware = require('./middleware/auth');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorHandlerMiddleware = require('./middleware/errorHandlerMiddleware');

app.use(express.json());

// 1. PUBLIC ROUTES & PROTECTED TASK ROUTES MUST BE FIRST
app.use('/api/users', userRouter);
app.use('/api/tasks', authMiddleware, taskRouter);

// 2. ERROR HANDLERS MUST BE AT THE VERY BOTTOM
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

module.exports = app;

app.use((req, res, next) => {
    res.status(404).json({ message: 'Not Found' });
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
});

module.exports = { app, server };