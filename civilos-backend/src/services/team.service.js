import Team from "../models/Team.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import ActivityLog from "../models/ActivityLog.js";
import { AppError } from "../middleware/errorHandler.js";

export const inviteMember = async (projectId, inviterId, { email, role }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError("User with this email not found", 404);

  const existing = await Team.findOne({ where: { project_id: projectId, user_id: user.id } });
  if (existing) throw new AppError("User is already a member", 409);

  const project = await Project.findByPk(projectId);
  if (project.owner_id === user.id) throw new AppError("User is the project owner", 409);

  const member = await Team.create({
    project_id: projectId,
    user_id: user.id,
    role: role || "viewer",
    invited_by: inviterId,
  });

  await ActivityLog.create({
    project_id: projectId,
    user_id: inviterId,
    action: "member_invited",
    entity_type: "team",
    entity_id: member.id,
    metadata: { invited_user: user.email, role },
  });

  return { ...member.toJSON(), user: { id: user.id, name: user.name, email: user.email } };
};

export const getTeam = async (projectId) => {
  return Team.findAll({
    where: { project_id: projectId },
    include: [{ model: User, as: "user", attributes: ["id", "name", "email", "avatar", "designation"] }],
    order: [["joined_at", "ASC"]],
  });
};

export const updateMemberRole = async (memberId, requesterId, role) => {
  const member = await Team.findByPk(memberId);
  if (!member) throw new AppError("Member not found", 404);
  if (member.role === "owner") throw new AppError("Cannot change owner role", 403);

  await member.update({ role });
  return member;
};

export const removeMember = async (memberId, projectId, requesterId) => {
  const member = await Team.findByPk(memberId);
  if (!member) throw new AppError("Member not found", 404);
  if (member.role === "owner") throw new AppError("Cannot remove project owner", 403);

  const project = await Project.findByPk(projectId);
  if (project.owner_id !== requesterId && member.user_id !== requesterId) {
    throw new AppError("Not authorized to remove this member", 403);
  }

  await member.destroy();
};