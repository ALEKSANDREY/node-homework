const express = require("express");
const app = express();

const pool = require("./db/pg-pool");

app.use(express.json());

// Routes must be active
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

/**
 * Health check endpoint to verify database connectivity.
 */
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: "ok", db: "connected" });
    } catch (err) {
        res.status(500).json({ message: `db not connected, error: ${err.message}` });
    }
});

/**
 * Global centralized error handling middleware.
 */
app.use((err, req, res, next) => {
    let status = err.status || 500;
    let message = err.message || "Internal Server Error";

    // Handle database connection errors specifically in response
    if (err.code === "ECONNREFUSED" || err.code === "57P01") {
        message = "db not connected";
        status = 500;
    }

    res.status(status).json({ message });
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