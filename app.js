const express = require('express');
const app = express();
const pool = require('./db/pg-pool');

const userRouter = require('./routes/userRoutes');
const taskRouter = require('./routes/taskRoutes');
const authMiddleware = require('./middleware/auth');
const notFoundMiddleware = require('./middleware/not-found');

// Only global user_id is retained as instructed
global.user_id = global.user_id || null;

app.use(express.json());

// Health check endpoint (matches exact required response shape)
app.get('/health', async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: "ok", db: "connected" });
    } catch (err) {
        res.status(500).json({ message: `db not connected, error: ${err.message}` });
    }
});

// Routes
app.use('/api/users', userRouter);
app.use('/api/tasks', authMiddleware, taskRouter);

// 404 Handler
app.use(notFoundMiddleware);

// Centralized Error Handler Middleware
app.use((err, req, res, next) => {
    if (err.code === "ECONNREFUSED" && err.port === 5432) {
        console.log("The database connection was refused. Is your database service running?");
    }

    const status = err.status || err.statusCode || 500;
    return res.status(status).json({ message: err.message || "Internal Server Error" });
});

// Graceful shutdown handling
const handleShutdown = async () => {
    await pool.end();
    process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

module.exports = app;