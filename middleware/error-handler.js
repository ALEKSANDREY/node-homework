// week-3-middleware/middleware/error-handler.js

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const errName = err.name || "Error";
    const errMessage = err.message || "Internal Server Error";

    // Format log output strictly as expected by Jest spies
    if (statusCode >= 400 && statusCode < 500) {
        console.warn(`WARN: ${errName} - ${errMessage}`);
    } else {
        console.error(`ERROR: ${errName} - ${errMessage}`);
    }

    const responseBody = {
        error: statusCode === 500 ? "Internal Server Error" : errMessage,
    };

    if (req.requestId) {
        responseBody.requestId = req.requestId;
    }

    return res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;