const express = require("express");
const app = express();
const timeRouter = require("./routes/timeRoutes");

// Built-in middleware to automatically parse incoming JSON bodies (No more data/end listeners!)
app.use(express.json());

// Main Root Routes
app.get("/", (req, res) => {
    res.send("Hello, World!");
});

app.post("/testpost", (req, res) => {
    res.status(200).json({
        message: "POST route works",
    });
});

// Use our externalized clean routing module under the /api prefix
app.use("/api", timeRouter);

// Advanced Task: Fallback wildcard route for unknown paths
app.all("/*splat", (req, res) => {
    res.status(404).json({
        message: `No route found for ${req.method} ${req.path}`,
    });
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
});

// Export elements for the testing suite
module.exports = { app, server };