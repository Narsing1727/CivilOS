import { Router } from "express";
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectSnapshot,
  getActivityFeed,
} from "../controllers/project.controller.js";
import { protect } from "../middleware/auth.js";
import { projectMember } from "../middleware/auth.js";
import { projectValidator } from "../validators/project.validator.js";
import { validate } from "../middleware/validate.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.post("/", projectValidator, validate, createProject);
router.get("/", getProjects);
router.get("/:projectId", projectMember, getProject);
router.put("/:projectId", projectMember, projectValidator, validate, updateProject);
router.delete("/:projectId", projectMember, deleteProject);
router.get("/:projectId/snapshot", projectMember, getProjectSnapshot);
router.get("/:projectId/activity", projectMember, getActivityFeed);

export default router;