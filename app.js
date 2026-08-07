const express = require('express');
const app = express();
const pool = require('./db/pg-pool');

const userRouter = require('./routes/userRoutes');
const taskRouter = require('./routes/taskRoutes');
const authMiddleware = require('./middleware/auth');
const notFoundMiddleware = require('./middleware/not-found');

global.users = global.users || [];
global.tasks = global.tasks || [];
global.user_id = global.user_id || null;

app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'ok', database: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

// Routes
app.use('/api/users', userRouter);
app.use('/api/tasks', authMiddleware, taskRouter);

// 404 Handler
app.use(notFoundMiddleware);

// Centralized Error Handler Middleware
app.use((err, req, res, next) => {
    // Check for database refusal at the top of error handler
    if (err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) {
        return res.status(500).json({ message: 'Database connection refused' });
    }

    const status = err.status || err.statusCode || 500;
    return res.status(status).json({ message: err.message || 'Internal Server Error' });
});

module.exports = app;