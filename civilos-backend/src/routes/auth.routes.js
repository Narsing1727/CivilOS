import { Router } from "express";
import { register, login, logout, refreshToken, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { registerValidator, loginValidator } from "../validators/auth.validator.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.post("/register", authLimiter, registerValidator, validate, register);
router.post("/login", authLimiter, loginValidator, validate, login);
router.post("/logout", protect, logout);
router.post("/refresh", refreshToken);
router.get("/me", protect, getMe);

export default router;