// week-3-middleware/routes/dogs.js
const express = require("express");
const router = express.Router();
const dogData = require("../dogData");
const { ValidationError, NotFoundError } = require("../errors");

// GET /dogs
router.get("/dogs", (req, res) => {
    res.status(200).json(dogData);
});

// POST /adopt
router.post("/adopt", (req, res, next) => {
    const body = req.body || {};
    const { name, email, dog: dogParam, dogName } = body;

    // Determine dog search name
    const searchName = dogParam || dogName || name;

    // 1. Validation: Require BOTH dog name AND applicant email (3C requirement)
    if (!searchName || !email) {
        return next(new ValidationError("Missing required fields"));
    }

    // 2. Search for dog in dataset by name (case-insensitive)
    const dog = dogData.find(
        (d) => d.name && d.name.toLowerCase() === searchName.toLowerCase()
    );

    // Check availability (dogData uses status: "available")
    const isAvailable =
        dog && (dog.status === "available" || dog.available === true);

    // If dog is not found or not available -> 404 (3C requirement)
    if (!dog || !isAvailable) {
        return next(new NotFoundError("Dog not found or not available"));
    }

    // 3. Success response formatting (3B & 3C requirement)
    const message = `Adoption request received. We will contact you at ${email} for further details.`;

    return res.status(201).json({
        message,
        dog,
    });
});

module.exports = router;