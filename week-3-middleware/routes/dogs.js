// week-3-middleware/routes/dogs.js
const express = require("express");
const router = express.Router();
const rawDogData = require("../dogData");
const { ValidationError, NotFoundError } = require("../errors");

// Helper to safely access dog array
const getDogArray = () => {
    if (Array.isArray(rawDogData)) return rawDogData;
    if (rawDogData && Array.isArray(rawDogData.dogData)) return rawDogData.dogData;
    if (rawDogData && Array.isArray(rawDogData.dogs)) return rawDogData.dogs;
    if (rawDogData && Array.isArray(rawDogData.default)) return rawDogData.default;
    return [];
};

// GET /dogs
router.get("/dogs", (req, res) => {
    res.status(200).json(getDogArray());
});

// POST /adopt
router.post("/adopt", (req, res, next) => {
    const body = req.body || {};

    // Priority order: dogName / dog / dog_name FIRST, then fall back to name
    const dogSearchName = body.dogName || body.dog || body.dog_name || body.name;
    const adopterEmail = body.email;

    // 1. Required fields check
    if (!dogSearchName || !adopterEmail) {
        return next(new ValidationError("Missing required fields"));
    }

    const dogList = getDogArray();
    const searchStr = String(dogSearchName).trim().toLowerCase();

    // 2. Find matching dog by name or id
    const dog = dogList.find((d) => {
        if (!d) return false;
        const dName = d.name ? String(d.name).trim().toLowerCase() : "";
        const dId = d.id != null ? String(d.id).trim().toLowerCase() : "";
        return dName === searchStr || dId === searchStr;
    });

    // 3. Check availability (in dogData.js status is "available")
    const isAvailable =
        dog &&
        (dog.status === "available" ||
            dog.available === true ||
            dog.available === "true" ||
            (dog.status === undefined && dog.available === undefined));

    if (!dog || !isAvailable) {
        return next(new NotFoundError("not found or not available"));
    }

    // 4. Success Response (201)
    return res.status(201).json({
        message: `Adoption request received. We will contact you at ${adopterEmail} for further details.`,
        dog,
    });
});

module.exports = router;