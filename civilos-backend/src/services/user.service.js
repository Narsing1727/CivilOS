import User from "../models/User.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { AppError } from "../middleware/errorHandler.js";

export const getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password", "refresh_token"] },
  });
  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const updateProfile = async (userId, data) => {
  const allowed = ["name", "designation", "avatar"];
  const updates = {};
  allowed.forEach((field) => {
    if (data[field] !== undefined) updates[field] = data[field];
  });

  await User.update(updates, { where: { id: userId } });
  return getProfile(userId);
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError("User not found", 404);

  const match = await comparePassword(currentPassword, user.password);
  if (!match) throw new AppError("Current password is incorrect", 401);

  const hashed = await hashPassword(newPassword);
  await user.update({ password: hashed });
};