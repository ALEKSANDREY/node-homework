// week-3-middleware/app.js
const express = require("express");
const path = require("path");
const { randomUUID } = require("crypto");
const dogRouter = require("./routes/dogs");

const app = express();

// 1. Custom Request ID Middleware
app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    next();
});

// 2. Custom Logging Middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
    next();
});

// 3. Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
});

// 4. JSON Body Parser with 1mb limit
app.use(express.json({ limit: "1mb" }));

// 5. Content-Type Validation Middleware
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

// 6. Static File Middleware
app.use(express.static(path.join(__dirname, "public")));

// 7. Mount Dog Routes AT ROOT ROUTE "/"
app.use("/", dogRouter);

// Base route for error checking verification
app.get("/error", (req, res, next) => {
    next(new Error("Internal Server Error"));
});

// 8. 404 Handler for Unmatched Routes
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found",
        requestId: req.requestId,
    });
});

// 9. Centralized Error Handler
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