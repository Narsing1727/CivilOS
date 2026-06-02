import { body } from "express-validator";

export const fileValidator = [
  body("category")
    .optional()
    .isIn(["model", "drawing", "specification", "calculation", "report", "other"])
    .withMessage("Invalid file category"),
];