import * as teamService from "../services/team.service.js";
import { success } from "../utils/response.js";

export const inviteMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const member = await teamService.inviteMember(req.params.projectId, req.user.id, { email, role });
    return success(res, member, "Member invited", 201);
  } catch (err) {
    next(err);
  }
};

export const getTeam = async (req, res, next) => {
  try {
    const team = await teamService.getTeam(req.params.projectId);
    return success(res, team, "Team fetched");
  } catch (err) {
    next(err);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const member = await teamService.updateMemberRole(req.params.memberId, req.user.id, role);
    return success(res, member, "Role updated");
  } catch (err) {
    next(err);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    await teamService.removeMember(req.params.memberId, req.params.projectId, req.user.id);
    return success(res, {}, "Member removed");
  } catch (err) {
    next(err);
  }
};