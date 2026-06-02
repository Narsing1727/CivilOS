import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "./errorHandler.js";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) throw new AppError("User not found", 401);

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };
};

export const projectMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await (await import("../models/Project.js")).default.findByPk(projectId);
    if (!project) throw new AppError("Project not found", 404);

    const team = await (await import("../models/Team.js")).default.findOne({
      where: { project_id: projectId, user_id: userId },
    });

    if (!team && project.owner_id !== userId) {
      throw new AppError("You are not a member of this project", 403);
    }

    req.project = project;
    req.teamRole = team?.role || "owner";
    next();
  } catch (err) {
    next(err);
  }
};