import { Router } from "express";
import {
  runComplianceCheck,
  getComplianceChecks,
  getComplianceCheck,
} from "../controllers/compliance.controller.js";
import { protect, projectMember } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiter.js";

const router = Router({ mergeParams: true });

router.use(protect, projectMember);

router.post("/", aiLimiter, runComplianceCheck);
router.get("/", getComplianceChecks);
router.get("/:checkId", getComplianceCheck);

export default router;