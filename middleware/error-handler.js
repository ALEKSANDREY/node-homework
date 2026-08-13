const errorHandlerMiddleware = (err, req, res, next) => {
    if (err.code === "ECONNREFUSED" && err.port === 5432) {
        console.log("The database connection was refused. Is your database service running?");
    }

    const status = err.status || err.statusCode || 500;
    return res.status(status).json({ message: err.message || "Internal Server Error" });
};

module.exports = errorHandlerMiddleware;