import { logger } from "../config/logger.js";

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
      user: req.user?.id || "guest",
    });
  });
  next();
};