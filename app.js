// app.js
const express = require("express");
const app = express();

const userRouter = require("./routes/userRoutes");
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");

// Initialize required globals
global.user_id = null;
global.users = [];
global.tasks = [];

// Middleware order: JSON parser -> Routes -> 404 -> Error Handler
app.use(express.json());


app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

app.use("/api/users", userRouter);
// Protected task routes
app.use("/api/tasks", authMiddleware, taskRouter);

app.use((req, res, next) => {
    res.status(404).json({ message: 'Not Found' });
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
});

module.exports = { app, server };