import { Router } from "express";
import { getProfile, updateProfile, changePassword } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);

export default router;