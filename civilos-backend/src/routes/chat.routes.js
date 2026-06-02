import { Router } from "express";
import { sendMessage, getMessages, clearHistory } from "../controllers/chat.controller.js";
import { protect, projectMember } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiter.js";

const router = Router({ mergeParams: true });

router.use(protect, projectMember);

router.post("/", aiLimiter, sendMessage);
router.get("/", getMessages);
router.delete("/", clearHistory);

export default router;