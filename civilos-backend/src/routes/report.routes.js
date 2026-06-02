import { Router } from "express";
import { generateReport, getReports, getReport, downloadReport } from "../controllers/report.controller.js";
import { protect, projectMember } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiter.js";

const router = Router({ mergeParams: true });

router.use(protect, projectMember);

router.post("/", aiLimiter, generateReport);
router.get("/", getReports);
router.get("/:reportId", getReport);
router.get("/:reportId/download", downloadReport);

export default router;