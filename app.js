const express = require('express');
const app = express();
const pool = require('./db/pg-pool');

const userRouter = require('./routes/userRoutes');
const taskRouter = require('./routes/taskRoutes');
const authMiddleware = require('./middleware/auth');
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

global.user_id = global.user_id || null;

app.use(express.json());

app.get('/health', async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: "ok", db: "connected" });
    } catch (err) {
        res.status(500).json({ message: `db not connected, error: ${err.message}` });
    }
});

app.use('/api/users', userRouter);
app.use('/api/tasks', authMiddleware, taskRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const handleShutdown = async () => {
    await pool.end();
    process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

module.exports = app;