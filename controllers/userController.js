const prisma = require("../db/prisma");
const crypto = require("crypto");
const { promisify } = require("util");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
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

const cookieFlags = (req) => {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
    };
};

const setJwtCookie = (req, res, user) => {
    const payload = { id: user.id, csrfToken: randomUUID() };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 });
    return payload.csrfToken;
};

exports.register = async (req, res, next = () => {}) => {
    if (!req.body) req.body = {};

    // --- reCAPTCHA Verification Start ---
    let isPerson = false;
    if (req.body.recaptchaToken) {
        const token = req.body.recaptchaToken;
        const params = new URLSearchParams();
        params.append("secret", process.env.RECAPTCHA_SECRET);
        params.append("response", token);
        params.append("remoteip", req.ip);

        try {
            const response = await fetch(
                "https://www.google.com/recaptcha/api/siteverify",
                {
                    method: "POST",
                    body: params.toString(),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );
            const data = await response.json();
            if (data.success) isPerson = true;
            delete req.body.recaptchaToken;
        } catch (err) {
            return next(err);
        }
    } else if (
        process.env.RECAPTCHA_BYPASS &&
        req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
    ) {
        isPerson = true;
    }

    if (!isPerson) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ message: "Bot verification failed. Please complete the reCAPTCHA." });
    }
    // --- reCAPTCHA Verification End ---

    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            message: error.details ? error.details[0].message : error.message,
            error: "Validation failed",
        });
    }

    try {
        const hashedPassword = await hashPassword(value.password);

        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name: value.name,
                    email: value.email.toLowerCase(),
                    hashedPassword: hashedPassword,
                },
                select: { id: true, email: true, name: true, createdAt: true },
            });

            const welcomeTaskData = [
                { title: "Complete your profile", userId: newUser.id, priority: "medium", isCompleted: false },
                { title: "Add your first task", userId: newUser.id, priority: "high", isCompleted: false },
                { title: "Explore the app", userId: newUser.id, priority: "low", isCompleted: false },
            ];

            await tx.task.createMany({ data: welcomeTaskData });

            const welcomeTasks = await tx.task.findMany({
                where: {
                    userId: newUser.id,
                    title: { in: welcomeTaskData.map((t) => t.title) },
                },
                select: {
                    id: true,
                    title: true,
                    isCompleted: true,
                    userId: true,
                    priority: true,
                },
            });

            return { user: newUser, welcomeTasks };
        });

        const csrfToken = setJwtCookie(req, res, result.user);

        return res.status(201).json({
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            user: result.user,
            welcomeTasks: result.welcomeTasks,
            csrfToken,
            transactionStatus: "success",
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
            where: { email: lowerEmail },
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials", error: "Invalid credentials" });
        }

        const isValid = await comparePassword(password, user.hashedPassword);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid credentials", error: "Invalid credentials" });
        }

        const csrfToken = setJwtCookie(req, res, user);

        return res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            csrfToken,
        });
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.logoff = async (req, res) => {
    res.clearCookie("jwt", cookieFlags(req));
    return res.status(200).json({ message: "Logged off successfully" });
};