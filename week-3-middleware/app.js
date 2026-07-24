// week-3-middleware/app.js
const express = require("express");
const path = require("path");
const { randomUUID } = require("crypto");
const dogRouter = require("./routes/dogs");

const app = express();

// Request ID
app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    next();
});

// Logger
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
    next();
});

// Security Headers
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
});

// Body Parser
app.use(express.json({ limit: "1mb" }));

// Content-Type Check for POST/PUT/PATCH
app.use((req, res, next) => {
    const methodsWithBody = ["POST", "PUT", "PATCH"];
    if (methodsWithBody.includes(req.method) && !req.is("application/json")) {
        return res.status(400).json({
            error: "Content-Type must be application/json",
            requestId: req.requestId,
        });
    }
    next();
});

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Dog Router
app.use("/", dogRouter);

// Test Error Route
app.get("/error", (req, res, next) => {
    next(new Error("Internal Server Error"));
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found",
        requestId: req.requestId,
    });
});

// Central Error Handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    if (statusCode >= 400 && statusCode < 500) {
        console.warn(`WARN: ${err.name || "Error"} - ${err.message}`);
    } else {
        console.error(`ERROR: ${err.name || "Error"} - ${err.message}`);
    }

    res.status(statusCode).json({
        error: statusCode === 500 ? "Internal Server Error" : err.message,
        requestId: req.requestId,
    });
});

module.exports = app;