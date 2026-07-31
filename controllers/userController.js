const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = await scrypt(password, salt, 64);
    return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
    const [salt, key] = storedHash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = await scrypt(inputPassword, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

exports.register = async (req, res) => {
    if (!req.body) req.body = {};

    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.message });
    }

    const existingUser = global.users.find((u) => u.email === value.email);
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await hashPassword(value.password);
    const newUser = {
        email: value.email,
        name: value.name,
        hashedPassword,
    };

    global.users.push(newUser);
    global.user_id = newUser;

    return res.status(201).json({ name: newUser.name, email: newUser.email });
};

exports.logon = async (req, res) => {
    if (!req.body) req.body = {};
    const { email, password } = req.body;

    const user = global.users.find((u) => u.email === email);
    const goodCredentials =
        user && (await comparePassword(password, user.hashedPassword));

    if (!goodCredentials) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    global.user_id = user;
    return res.status(200).json({ name: user.name, email: user.email });
};

exports.logoff = (req, res) => {
    global.user_id = null;
    return res.sendStatus(200);
};