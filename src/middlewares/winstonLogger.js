const winston = require("winston");
const expressWinston = require("express-winston");

// Define Winston Logger Configuration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(), // Logs to console
    new winston.transports.File({ filename: "logs/app.log" }), // Logs to a file
  ],
});

// Middleware for Logging HTTP Requests
const requestLogger = expressWinston.logger({
  winstonInstance: logger,
  meta: true, // Log request metadata
  expressFormat: true, // Use default Express format
  colorize: false,
});

// Middleware for Logging Errors
const errorLogger = expressWinston.errorLogger({
  winstonInstance: logger,
});

module.exports = { logger, requestLogger, errorLogger };
