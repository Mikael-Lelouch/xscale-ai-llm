const winston = require("winston");
const path = require("path");
const fs = require("fs");

/**
 * Logger singleton class for centralized logging
 * Uses Winston in production and console in development
 */
class Logger {
  logger = console;
  static _instance;

  /**
   * Creates or returns existing Logger singleton instance
   */
  constructor() {
    if (Logger._instance) return Logger._instance;
    this.logger =
      process.env.NODE_ENV === "production" ? this.getWinstonLogger() : console;
    Logger._instance = this;
  }

  /**
   * Creates and configures a Winston logger instance with file and console transports
   * @returns {winston.Logger} Configured Winston logger instance
   */
  getWinstonLogger() {
    const logDir = process.env.LOG_DIR || "./storage/logs";
    const logLevel = process.env.LOG_LEVEL || "info";

    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const transports = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(
            ({ level, message, service, origin = "" }) => {
              return `\x1b[36m[${service}]\x1b[0m${origin ? `\x1b[33m[${origin}]\x1b[0m` : ""} ${level}: ${message}`;
            }
          )
        ),
      }),
    ];

    // Add file transports for production
    if (process.env.NODE_ENV === "production") {
      // Combined log file with rotation
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, "combined.log"),
          format: winston.format.combine(
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            winston.format.json()
          ),
          maxsize: 52428800, // 50MB
          maxFiles: 7, // 7-day retention
        })
      );

      // Error log file
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, "error.log"),
          level: "error",
          format: winston.format.combine(
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            winston.format.json()
          ),
          maxsize: 52428800,
          maxFiles: 7,
        })
      );
    }

    const logger = winston.createLogger({
      level: logLevel,
      defaultMeta: { service: "backend" },
      transports,
    });

    /**
     * Formats log arguments for consistent output
     * @param {Array} args - Log arguments to format
     * @returns {string} Formatted log message
     */
    function formatArgs(args) {
      return args
        .map((arg) => {
          if (arg instanceof Error) {
            return arg.stack;
          } else if (typeof arg === "object") {
            return JSON.stringify(arg);
          } else {
            return arg;
          }
        })
        .join(" ");
    }

    console.log = function (...args) {
      logger.info(formatArgs(args));
    };
    console.error = function (...args) {
      logger.error(formatArgs(args));
    };
    console.info = function (...args) {
      logger.warn(formatArgs(args));
    };
    return logger;
  }
}

/**
 * Initializes and sets up the logger singleton
 * Overrides console.log, console.error, and console.info methods
 * This is a singleton method and will not create multiple loggers
 * @returns {winston.Logger|console} Instantiated logger interface (Winston in production, console in development)
 */
function setLogger() {
  return new Logger().logger;
}
module.exports = setLogger;
