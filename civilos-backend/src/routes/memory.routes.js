import { Router } from "express";
import { addMemory, getMemories, searchMemory, deleteMemory } from "../controllers/memory.controller.js";
import { protect, projectMember } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiter.js";

const router = Router({ mergeParams: true });

router.use(protect, projectMember);

router.post("/", addMemory);
router.get("/", getMemories);
router.post("/search", aiLimiter, searchMemory);
router.delete("/:memoryId", deleteMemory);

export default router;