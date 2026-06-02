import { Op } from "sequelize";
import Project from "../models/Project.js";
import Team from "../models/Team.js";
import File from "../models/File.js";
import ActivityLog from "../models/ActivityLog.js";
import User from "../models/User.js";
import { AppError } from "../middleware/errorHandler.js";

export const createProject = async (userId, data) => {
  const project = await Project.create({
    name: data.name,
    description: data.description,
    type: data.type || "other",
    owner_id: userId,
  });

  await Team.create({
    project_id: project.id,
    user_id: userId,
    role: "owner",
  });

  await ActivityLog.create({
    project_id: project.id,
    user_id: userId,
    action: "project_created",
    entity_type: "project",
    entity_id: project.id,
  });

  return project;
};

export const getProjects = async (userId, { limit, offset }) => {
  const memberProjectIds = await Team.findAll({
    where: { user_id: userId },
    attributes: ["project_id"],
  });

  const ids = memberProjectIds.map((t) => t.project_id);

  return Project.findAndCountAll({
    where: { id: { [Op.in]: ids } },
    limit,
    offset,
    order: [["created_at", "DESC"]],
    include: [{ model: User, as: "owner", attributes: ["id", "name", "avatar"] }],
  });
};

export const getProject = async (projectId) => {
  const project = await Project.findByPk(projectId, {
    include: [{ model: User, as: "owner", attributes: ["id", "name", "avatar"] }],
  });
  if (!project) throw new AppError("Project not found", 404);
  return project;
};

export const updateProject = async (projectId, data) => {
  const project = await Project.findByPk(projectId);
  if (!project) throw new AppError("Project not found", 404);

  const allowed = ["name", "description", "type", "status", "icon", "metadata"];
  const updates = {};
  allowed.forEach((field) => {
    if (data[field] !== undefined) updates[field] = data[field];
  });

  await project.update(updates);
  return project;
};

export const deleteProject = async (projectId, userId) => {
  const project = await Project.findByPk(projectId);
  if (!project) throw new AppError("Project not found", 404);
  if (project.owner_id !== userId) throw new AppError("Only the owner can delete this project", 403);
  await project.destroy();
};

export const getProjectSnapshot = async (projectId) => {
  const project = await Project.findByPk(projectId);
  if (!project) throw new AppError("Project not found", 404);

  const fileCount = await File.count({ where: { project_id: projectId } });
  const memberCount = await Team.count({ where: { project_id: projectId } });
  const recentFiles = await File.findAll({
    where: { project_id: projectId },
    order: [["created_at", "DESC"]],
    limit: 5,
    attributes: ["id", "original_name", "file_type", "category", "created_at"],
  });

  return {
    project,
    stats: { file_count: fileCount, member_count: memberCount },
    recent_files: recentFiles,
  };
};

export const getActivityFeed = async (projectId, { limit, offset }) => {
  return ActivityLog.findAndCountAll({
    where: { project_id: projectId },
    limit,
    offset,
    order: [["created_at", "DESC"]],
    include: [{ model: User, as: "user", attributes: ["id", "name", "avatar"] }],
  });
};