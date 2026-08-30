const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

router.get("/tasks/search", analyticsController.searchTasks);
router.get("/users/:id", analyticsController.getUserAnalytics);
router.get("/users", analyticsController.getUsersWithStats);

module.exports = router;