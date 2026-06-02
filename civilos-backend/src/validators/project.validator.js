import { body } from "express-validator";

export const projectValidator = [
  body("name").trim().notEmpty().withMessage("Project name is required"),
  body("type")
    .optional()
    .isIn(["bridge", "building", "road", "dam", "tunnel", "other"])
    .withMessage("Invalid project type"),
  body("description").optional().trim(),
];