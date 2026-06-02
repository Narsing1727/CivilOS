import * as projectService from "../services/project.service.js";
import { success, paginated } from "../utils/response.js";
import { getPagination } from "../utils/paginate.js";

export const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.user.id, req.body);
    return success(res, project, "Project created", 201);
  } catch (err) {
    next(err);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { rows, count } = await projectService.getProjects(req.user.id, { limit, offset });
    return paginated(res, rows, count, page, limit, "Projects fetched");
  } catch (err) {
    next(err);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProject(req.params.projectId);
    return success(res, project, "Project fetched");
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.projectId, req.body);
    return success(res, project, "Project updated");
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    await projectService.deleteProject(req.params.projectId, req.user.id);
    return success(res, {}, "Project deleted");
  } catch (err) {
    next(err);
  }
};

export const getProjectSnapshot = async (req, res, next) => {
  try {
    const snapshot = await projectService.getProjectSnapshot(req.params.projectId);
    return success(res, snapshot, "Snapshot fetched");
  } catch (err) {
    next(err);
  }
};

export const getActivityFeed = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { rows, count } = await projectService.getActivityFeed(req.params.projectId, { limit, offset });
    return paginated(res, rows, count, page, limit, "Activity feed fetched");
  } catch (err) {
    next(err);
  }
};