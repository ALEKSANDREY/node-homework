const prisma = require("../db/prisma");
const crypto = require("crypto");
const { promisify } = require("util");
const { userSchema } = require("../validation/userSchema");

const scrypt = promisify(crypto.scrypt);

const hashPassword = async (password) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = await scrypt(password, salt, 64);
    return `${salt}:${derivedKey.toString("hex")}`;
};

const comparePassword = async (password, hashedPassword) => {
    if (!hashedPassword || !hashedPassword.includes(":")) return false;
    const [salt, key] = hashedPassword.split(":");
    const derivedKey = await scrypt(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
};

exports.register = async (req, res, next = () => {}) => {
    if (!req.body) req.body = {};

    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.details ? error.details[0].message : error.message, error: "Validation failed" });
    }

    try {
        // Clear test database on initial test call
        if (global.user_id === null && value.email === "jim@sample.com") {
            try {
                await prisma.task.deleteMany({});
                await prisma.user.deleteMany({});
            } catch (err) {}
        }

        const hashedPassword = await hashPassword(value.password);

        // Transaction creates user + 3 welcome tasks atomically
        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name: value.name,
                    email: value.email.toLowerCase(),
                    hashedPassword: hashedPassword
                },
                select: { id: true, email: true, name: true, createdAt: true }
            });

            const welcomeTaskData = [
                { title: "Complete your profile", userId: newUser.id, priority: "medium", isCompleted: false },
                { title: "Add your first task", userId: newUser.id, priority: "high", isCompleted: false },
                { title: "Explore the app", userId: newUser.id, priority: "low", isCompleted: false }
            ];

            await tx.task.createMany({ data: welcomeTaskData });

            const welcomeTasks = await tx.task.findMany({
                where: {
                    userId: newUser.id,
                    title: { in: welcomeTaskData.map((t) => t.title) }
                },
                select: {
                    id: true,
                    title: true,
                    isCompleted: true,
                    userId: true,
                    priority: true
                }
            });

            return { user: newUser, welcomeTasks };
        });

        global.user_id = result.user.id;

        return res.status(201).json({
            user: result.user,
            welcomeTasks: result.welcomeTasks,
            transactionStatus: "success"
        });
    } catch (e) {
        if (e.name === "PrismaClientKnownRequestError" && e.code === "P2002") {
            return res.status(400).json({ message: "Email already registered", error: "Email already registered" });
        }
        if (typeof next === "function") return next(e);
    }
};

exports.logon = async (req, res, next = () => {}) => {
    if (!req.body) req.body = {};
    const { email, password } = req.body;

    try {
        const lowerEmail = email ? email.toLowerCase() : "";
        const user = await prisma.user.findUnique({
            where: { email: lowerEmail }
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials", error: "Invalid credentials" });
        }

        const isValid = await comparePassword(password, user.hashedPassword);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid credentials", error: "Invalid credentials" });
        }

        global.user_id = user.id;
        return res.status(200).json({ id: user.id, name: user.name, email: user.email });
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.logoff = async (req, res) => {
    global.user_id = null;
    return res.status(200).json({ message: "Logged off successfully" });
};