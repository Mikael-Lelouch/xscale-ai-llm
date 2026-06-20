/**
 * PHASE 5: Security Headers Middleware
 * Implements security best practices via HTTP headers
 */

/**
 * Apply security headers to all responses
 * Headers implemented:
 * - HSTS: Force HTTPS
 * - CSP: Content Security Policy
 * - X-Content-Type-Options: Prevent MIME sniffing
 * - X-Frame-Options: Clickjacking protection
 * - X-XSS-Protection: Legacy XSS protection
 * - Referrer-Policy: Control referrer information
 * - Permissions-Policy: Restrict browser features
 * - Strict-Transport-Security: Enforce TLS
 */
function securityHeadersMiddleware(req, res, next) {
  // HSTS: Force HTTPS for 1 year (includeSubDomains)
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // CSP: Mitigate XSS attacks
  // Adjust policy based on your needs
  const cspPolicy =
    process.env.NODE_ENV === "production"
      ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none';"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https: ws: wss:; frame-ancestors 'none';";

  res.setHeader("Content-Security-Policy", cspPolicy);

  // X-Content-Type-Options: Prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // X-Frame-Options: Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // X-XSS-Protection: Legacy XSS protection (for older browsers)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer-Policy: Control referrer information
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions-Policy: Restrict browser features (replaces Feature-Policy)
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), magnetometer=(), payment=(), usb=()"
  );

  // Remove server identification header
  res.removeHeader("X-Powered-By");

  // Additional headers for API endpoints
  if (req.path.startsWith("/api")) {
    // Prevent caching of sensitive API responses
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
}

/**
 * CORS hardening middleware
 * Restricts cross-origin requests to whitelisted origins
 */
function corsHardeningMiddleware(allowedOrigins = []) {
  return (req, res, next) => {
    const origin = req.get("Origin");

    // Default allowed origins
    const defaultOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ];

    const origins = new Set([...defaultOrigins, ...allowedOrigins]);

    // Add from environment variable
    if (process.env.ALLOWED_ORIGINS) {
      process.env.ALLOWED_ORIGINS.split(",").forEach((o) => origins.add(o.trim()));
    }

    if (origins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Max-Age", "3600");
    }

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  };
}

/**
 * Rate limiting middleware
 * Prevents abuse by limiting request frequency
 */
function rateLimitingMiddleware(options = {}) {
  const {
    maxRequests = 100,
    windowMs = 60 * 1000, // 1 minute
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  const store = new Map(); // Simple in-memory store

  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();

    if (!store.has(key)) {
      store.set(key, { count: 0, resetTime: now + windowMs });
    }

    const record = store.get(key);

    // Reset window if expired
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count++;

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count));
    res.setHeader(
      "X-RateLimit-Reset",
      Math.ceil(record.resetTime / 1000)
    );

    // Check if limit exceeded
    if (record.count > maxRequests) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "You have exceeded the rate limit. Please try again later.",
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    next();
  };
}

/**
 * TLS enforcement middleware
 * Ensures all requests use HTTPS in production
 */
function tlsEnforcementMiddleware(req, res, next) {
  if (
    process.env.NODE_ENV === "production" &&
    !req.secure &&
    req.get("x-forwarded-proto") !== "https"
  ) {
    return res.status(403).json({
      error: "HTTPS Required",
      message: "This endpoint requires a secure HTTPS connection.",
    });
  }

  next();
}

/**
 * Sanitize request headers
 * Remove potentially dangerous headers from user input
 */
function sanitizeHeadersMiddleware(req, res, next) {
  // Remove headers that could be used in attacks
  const dangerousHeaders = [
    "x-forwarded-proto",
    "x-forwarded-for",
    "x-forwarded-host",
    "x-original-forwarded-for",
  ];

  // These headers should only be set by proxies, not clients
  if (!req.get("x-forwarded-for")) {
    // Only trust these if they come from a trusted proxy
    dangerousHeaders.forEach((header) => {
      delete req.headers[header];
    });
  }

  next();
}

/**
 * Detect and prevent suspicious requests
 */
function suspiciousRequestDetectionMiddleware(req, res, next) {
  const path = req.path;
  const userAgent = req.get("user-agent") || "";

  // Check for common attack patterns
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /\x00/, // Null byte
    /<script/i, // Script injection
    /onclick=/i, // Event injection
    /onerror=/i, // Error handler injection
    /eval\(/i, // Eval injection
  ];

  // Check path and user-agent
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(path) || pattern.test(userAgent)) {
      console.warn("[SECURITY] Suspicious request detected:", {
        path,
        ip: req.ip,
        userAgent,
      });

      // Log the attempt
      // In production, you might want to block these or log to security monitoring
      if (pattern.test(path)) {
        return res.status(400).json({
          error: "Invalid Request",
          message: "Your request contains invalid characters or patterns.",
        });
      }
    }
  }

  next();
}

module.exports = {
  securityHeadersMiddleware,
  corsHardeningMiddleware,
  rateLimitingMiddleware,
  tlsEnforcementMiddleware,
  sanitizeHeadersMiddleware,
  suspiciousRequestDetectionMiddleware,
};
