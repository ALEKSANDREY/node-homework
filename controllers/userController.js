const crypto = require("crypto");
const { userSchema } = require("../validation/userSchema");

// Helper: Hash password using crypto.scrypt
const hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString("hex");
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) return reject(err);
            resolve(`${salt}:${derivedKey.toString("hex")}`);
        });
    });
};

// Helper: Compare password using stored salt and hash
const comparePassword = (password, storedHash) => {
    return new Promise((resolve, reject) => {
        if (!storedHash) return resolve(false);
        const [salt, key] = storedHash.split(":");
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) return reject(err);
            resolve(key === derivedKey.toString("hex"));
        });
    });
};

// 1. Register User
exports.register = async (req, res) => {
    if (!req.body) req.body = {};

    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.message });
    }

    const hashedPassword = await hashPassword(value.password);

    const newUser = {
        id: global.users.length + 1,
        name: value.name,
        email: value.email,
        hashedPassword: hashedPassword,
    };

    global.users.push(newUser);

    return res.status(201).json({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
    });
};

// 2. Logon User
exports.logon = async (req, res) => {
    const { email, password } = req.body || {};

    const user = global.users.find((u) => u.email === email);
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await comparePassword(password, user.hashedPassword);
    if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    // Set active global user identifier to user ID
    global.user_id = user.id;

    return res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
    });
};

// 3. Logoff User
exports.logoff = async (req, res) => {
    global.user_id = null;
    return res.status(200).json({ message: "Logged off successfully" });
};