import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import projectRoutes from "./project.routes.js";
import fileRoutes from "./file.routes.js";
import chatRoutes from "./chat.routes.js";
import complianceRoutes from "./compliance.routes.js";
import reportRoutes from "./report.routes.js";
import memoryRoutes from "./memory.routes.js";
import teamRoutes from "./team.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/projects/:projectId/files", fileRoutes);
router.use("/projects/:projectId/chat", chatRoutes);
router.use("/projects/:projectId/compliance", complianceRoutes);
router.use("/projects/:projectId/reports", reportRoutes);
router.use("/projects/:projectId/memory", memoryRoutes);
router.use("/projects/:projectId/team", teamRoutes);

export default router;