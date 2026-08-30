const prisma = require("../db/prisma");

exports.getUserAnalytics = async (req, res, next = () => {}) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
        const userExists = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!userExists) {
            return res.status(404).json({ message: "User not found", error: "User not found" });
        }

        // Count tasks by completion status using groupBy
        const taskStats = await prisma.task.groupBy({
            by: ["isCompleted"],
            where: { userId },
            _count: { id: true }
        });

        // 10 most recent tasks with user info
        const recentTasks = await prisma.task.findMany({
            where: { userId },
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
                createdAt: true,
                userId: true,
                User: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 10
        });

        // Tasks created per day in the last 7 days
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weeklyProgress = await prisma.task.groupBy({
            by: ["createdAt"],
            where: {
                userId,
                createdAt: { gte: oneWeekAgo }
            },
            _count: { id: true }
        });

        return res.status(200).json({
            taskStats,
            recentTasks,
            weeklyProgress
        });
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.getUsersWithStats = async (req, res, next = () => {}) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const usersRaw = await prisma.user.findMany({
            include: {
                Task: {
                    where: { isCompleted: false },
                    select: { id: true },
                    take: 5
                },
                _count: {
                    select: { Task: true }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" }
        });

        const users = usersRaw.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            createdAt: u.createdAt,
            _count: u._count,
            Task: u.Task
        }));

        const totalUsers = await prisma.user.count();

        const pagination = {
            page,
            limit,
            total: totalUsers,
            pages: Math.ceil(totalUsers / limit) || 1,
            hasNext: page * limit < totalUsers,
            hasPrev: page > 1
        };

        return res.status(200).json({ users, pagination });
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};

exports.searchTasks = async (req, res, next = () => {}) => {
    const searchQuery = req.query.q;

    if (!searchQuery || searchQuery.trim().length < 2) {
        return res.status(400).json({ error: "Search query must be at least 2 characters long" });
    }

    const limit = parseInt(req.query.limit, 10) || 20;
    const searchPattern = `%${searchQuery}%`;
    const exactMatch = searchQuery;
    const startsWith = `${searchQuery}%`;

    try {
        const searchResults = await prisma.$queryRaw`
            SELECT 
                t.id,
                t.title,
                t.is_completed AS "isCompleted",
                t.priority,
                t.created_at AS "createdAt",
                t.user_id AS "userId",
                u.name AS "user_name"
            FROM tasks t
            JOIN users u ON t.user_id = u.id
            WHERE t.title ILIKE ${searchPattern}
               OR u.name ILIKE ${searchPattern}
            ORDER BY 
                CASE 
                    WHEN t.title ILIKE ${exactMatch} THEN 1
                    WHEN t.title ILIKE ${startsWith} THEN 2
                    WHEN t.title ILIKE ${searchPattern} THEN 3
                    ELSE 4
                END,
                t.created_at DESC
            LIMIT ${limit}
        `;

        return res.status(200).json({
            results: searchResults,
            query: searchQuery,
            count: searchResults.length
        });
    } catch (err) {
        if (typeof next === "function") return next(err);
    }
};