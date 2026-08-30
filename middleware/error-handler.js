const errorHandlerMiddleware = (err, req, res, next) => {
    if (err.name === "PrismaClientInitializationError" || (err.code === "ECONNREFUSED" && err.port === 5432)) {
        console.error("Couldn't connect to the database. Is it running?");
    }

    const status = err.status || err.statusCode || 500;
    return res.status(status).json({ message: err.message || "Internal Server Error" });
};

module.exports = errorHandlerMiddleware;