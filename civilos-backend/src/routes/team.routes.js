import { Router } from "express";
import { inviteMember, getTeam, updateMemberRole, removeMember } from "../controllers/team.controller.js";
import { protect, projectMember } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.use(protect, projectMember);

router.post("/invite", inviteMember);
router.get("/", getTeam);
router.put("/:memberId", updateMemberRole);
router.delete("/:memberId", removeMember);

export default router;