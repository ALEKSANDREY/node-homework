const express = require("express");
const app = express();

// Import database connection pool module
const pool = require("./db/pg-pool");

app.use(express.json());

/**
 * Health check endpoint to verify database connectivity.
 * Executes a light query to ensure pool responsiveness.
 */
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: "ok", db: "connected" });
    } catch (err) {
        res.status(500).json({ message: `db not connected, error: ${err.message}` });
    }
});
// const userRoutes = require("./routes/userRoutes");
// const taskRoutes = require("./routes/taskRoutes");
// app.use("/api/users", userRoutes);
// app.use("/api/tasks", taskRoutes);
/**
 * Global centralized error handling middleware.
 * Formats uncaught errors into JSON responses and detects specific database connection failures.
 */
app.use((err, req, res, next) => {
    if (err.code === "ECONNREFUSED" && err.port === 5432) {
        console.error("Database connection refused. Ensure PostgreSQL service is running on port 5432.");
    }

    const status = err.status || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
});

/**
 * Graceful shutdown process for active database pool connections.
 */
const gracefulShutdown = async () => {
    await pool.end();
    process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

module.exports = app;