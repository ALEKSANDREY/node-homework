const pool = require("../db/pg-pool");
const crypto = require("crypto");
const { promisify } = require("util");
const { userSchema } = require("../validation/userSchema");

const scrypt = promisify(crypto.scrypt);

/**
 * Generates a salt and hashes a plaintext password using crypto.scrypt.
 * @param {string} password
 * @returns {Promise<string>} Salt and hash joined by a colon separator.
 */
const hashPassword = async (password) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = await scrypt(password, salt, 64);
    return `${salt}:${derivedKey.toString("hex")}`;
};

/**
 * Verifies a plaintext password against a stored salt-hash value.
 * Uses timingSafeEqual to guard against timing attacks.
 */
const comparePassword = async (password, hashedPassword) => {
    if (!hashedPassword || !hashedPassword.includes(":")) return false;
    const [salt, key] = hashedPassword.split(":");
    const derivedKey = await scrypt(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
};

/**
 * Handles user registration.
 * Validates request payload, hashes password, and persists user record to PostgreSQL.
 */
exports.register = async (req, res, next = () => {}) => {
    if (!req.body) req.body = {};

    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.details ? error.details[0].message : error.message });
    }

    try {
        const hashedPassword = await hashPassword(value.password);
        const result = await pool.query(
            `INSERT INTO users (email, name, hashed_password) VALUES ($1, $2, $3) RETURNING id, email, name`,
            [value.email, value.name, hashedPassword]
        );

        const newUser = result.rows[0];
        global.user_id = newUser.id;

        return res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email });
    } catch (e) {
        if (e.code === "23505") {
            return res.status(400).json({ message: "Email already registered" });
        }
        if (typeof next === "function") return next(e);
    }
};

/**
 * Handles user authentication.
 * Validates credentials against persistent user database records.
 */
exports.logon = async (req, res, next = () => {}) => {
    if (!req.body) req.body = {};
    const { email, password } = req.body;

    try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = result.rows[0];
        const isValid = await comparePassword(password, user.hashed_password);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        global.user_id = user.id;
        return res.status(200).json({ id: user.id, name: user.name, email: user.email });
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

/**
 * Clears active session user identifier.
 */
exports.logoff = async (req, res) => {
    global.user_id = null;
    return res.status(200).json({ message: "Logged off successfully" });
};