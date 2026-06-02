import { upload } from "../config/storage.js";
import { AppError } from "./errorHandler.js";

export const uploadSingle = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) return next(new AppError(err.message, 400));
    next();
  });
};

export const uploadMultiple = (fieldName, maxCount = 10) => (req, res, next) => {
  upload.array(fieldName, maxCount)(req, res, (err) => {
    if (err) return next(new AppError(err.message, 400));
    next();
  });
};