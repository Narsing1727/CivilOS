import * as authService from "../services/auth.service.js";
import { success, error } from "../utils/response.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password, designation } = req.body;
    const data = await authService.register({ name, email, password, designation });
    return success(res, data, "Account created successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login({ email, password });
    return success(res, data, "Login successful");
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    return success(res, {}, "Logged out successfully");
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    const data = await authService.refreshToken(refresh_token);
    return success(res, data, "Token refreshed");
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return success(res, req.user, "User fetched");
  } catch (err) {
    next(err);
  }
};