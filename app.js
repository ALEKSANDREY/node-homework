const express = require('express');
const app = express();
const prisma = require('./db/prisma');

const userRouter = require('./routes/userRoutes');
const taskRouter = require('./routes/taskRoutes');
const authMiddleware = require('./middleware/auth');
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

global.user_id = global.user_id || null;

app.use(express.json());

// Health Check Endpoint with Prisma
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', db: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
    }
});

// Routes
app.use('/api/users', userRouter);
app.use('/api/tasks', authMiddleware, taskRouter);

// Middlewares
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Graceful Shutdown
const handleShutdown = async () => {
    await prisma.$disconnect();
    console.log("Prisma disconnected");
    process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

module.exports = app;