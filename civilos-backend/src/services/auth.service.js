import User from "../models/User.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { AppError } from "../middleware/errorHandler.js";

export const register = async ({ name, email, password, designation }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new AppError("Email already registered", 409);

  const hashed = await hashPassword(password);
  const user = await User.create({ name, email, password: hashed, designation });

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  await user.update({ refresh_token: refreshToken });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
    },
    access_token: accessToken,
    refresh_token: refreshToken,
  };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError("Invalid email or password", 401);

  const match = await comparePassword(password, user.password);
  if (!match) throw new AppError("Invalid email or password", 401);

  if (!user.is_active) throw new AppError("Account is deactivated", 403);

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  await user.update({ refresh_token: refreshToken });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      avatar: user.avatar,
    },
    access_token: accessToken,
    refresh_token: refreshToken,
  };
};

export const logout = async (userId) => {
  await User.update({ refresh_token: null }, { where: { id: userId } });
};

export const refreshToken = async (token) => {
  if (!token) throw new AppError("Refresh token required", 400);

  const decoded = verifyRefreshToken(token);
  const user = await User.findByPk(decoded.id);

  if (!user || user.refresh_token !== token) {
    throw new AppError("Invalid refresh token", 401);
  }

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const newRefreshToken = signRefreshToken({ id: user.id });

  await user.update({ refresh_token: newRefreshToken });

  return { access_token: accessToken, refresh_token: newRefreshToken };
};