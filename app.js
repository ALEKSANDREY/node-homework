const express = require("express");
const app = express();
const timeRouter = require("./routes/timeRoutes");
const userRouter = require("./routes/userRoutes");

// Custom Middleware
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

//Initialize global temporary database variables (Week 3 requirement)
global.user_id = null;
global.users = [];
global.tasks = [];

// Built-in middleware to automatically parse incoming JSON bodies
app.use(express.json());

//Mount Routers
app.use("/api", timeRouter);        // Keeps /api/time and /api/echo working
app.use("/api/users", userRouter);  // Mounts /api/users/register, logon, logoff

// Main Root Routes
app.get("/", (req, res) => {
    res.send("Hello, World!");
});

app.post("/testpost", (req, res) => {
    res.status(200).json({
        message: "POST route works",
    });
});
// Catch-all Not Found Middleware
app.use(notFoundMiddleware);

// Global Error Handler Middleware (Must be at the very end!)
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
});

// Export elements for the testing suite
module.exports = { app, server };