const express = require("express");
const app = express();
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");
const cookieParser = require("cookie-parser");

const prisma = require("./db/prisma");
const userRouter = require("./routes/userRoutes");
const taskRouter = require("./routes/taskRoutes");
const analyticsRouter = require("./routes/analyticsRoutes");
const jwtMiddleware = require("./middleware/jwtMiddleware");
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

app.set("trust proxy", 1);

// Rate limiter placed first to protect against floods
app.use(
    rateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 100,
    })
);

// Helmet security headers
app.use(helmet());

// Body and cookie parsing
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// XSS Sanitizer placed after body/cookie parsers
app.use(xss());

// Health check endpoint
app.get("/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ok", db: "connected" });
    } catch (err) {
        res.status(500).json({ status: "error", db: "not connected", error: err.message });
    }
});

// Route handlers
app.use("/api/users", userRouter);
app.use("/user", userRouter); // Supports /user/register and /api/users/register
app.use("/api/tasks", jwtMiddleware, taskRouter);
app.use("/api/analytics", jwtMiddleware, analyticsRouter);

// Middlewares
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Graceful shutdown
const handleShutdown = async () => {
    await prisma.$disconnect();
    console.log("Prisma disconnected");
    process.exit(0);
};

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    if (process.env.NODE_ENV !== "test") {
        console.log(`Server is running on http://localhost:${PORT}`);
    }
});

app.server = server;
app.app = app;
server.server = server;
server.app = app;

module.exports = app;
module.exports.app = app;
module.exports.server = server;