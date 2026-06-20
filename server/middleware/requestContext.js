const { v4: uuidv4 } = require("uuid");

/**
 * Middleware to attach request ID and context to all requests
 * Enables request tracing through logs and metrics
 */
function requestContextMiddleware() {
  return (req, res, next) => {
    // Generate or extract request ID
    const requestId = req.headers["x-request-id"] || uuidv4();
    req.id = requestId;

    // Add request ID to response headers
    res.setHeader("X-Request-ID", requestId);

    // Store start time for duration calculation
    req.startTime = Date.now();

    // Store in Express locals for access in route handlers
    res.locals.requestId = requestId;

    next();
  };
}

module.exports = requestContextMiddleware;
