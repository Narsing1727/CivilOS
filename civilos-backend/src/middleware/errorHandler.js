import { logger } from "../config/logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.path });

  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      message: "Duplicate entry",
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  if (err.message?.includes("File type")) {
    return res.status(415).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
};

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}