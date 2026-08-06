const crypto = require('crypto');
const { promisify } = require('util');
const { userSchema } = require('../validation/userSchema');

const scrypt = promisify(crypto.scrypt);

const hashPassword = async (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = await scrypt(password, salt, 64);
    return `${salt}:${derivedKey.toString('hex')}`;
};

const comparePassword = async (password, hashedPassword) => {
    if (!hashedPassword || !hashedPassword.includes(':')) return false;
    const [salt, key] = hashedPassword.split(':');
    const derivedKey = await scrypt(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
};

exports.register = async (req, res) => {
    if (!req.body) req.body = {};

    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { name, email, password } = value;


    const existingUser = global.users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const nextId = global.users.length > 0 ? Math.max(...global.users.map(u => Number(u.id) || 0)) + 1 : 1;

    const newUser = {
        id: nextId,
        name,
        email,
        hashedPassword
    };

    global.users.push(newUser);
    global.user_id = newUser;

    return res.status(201).json({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
    });
};

exports.logon = async (req, res) => {
    if (!req.body) req.body = {};
    const { email, password } = req.body;

    const user = global.users.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await comparePassword(password, user.hashedPassword);
    if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    global.user_id = user;

    return res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email
    });
};

exports.logoff = async (req, res) => {
    global.user_id = null;
    return res.status(200).json({ message: "Logged off successfully" });
};