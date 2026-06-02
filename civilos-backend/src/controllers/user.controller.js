import * as userService from "../services/user.service.js";
import { success } from "../utils/response.js";

export const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
    return success(res, user, "Profile fetched");
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    return success(res, user, "Profile updated");
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    await userService.changePassword(req.user.id, current_password, new_password);
    return success(res, {}, "Password changed");
  } catch (err) {
    next(err);
  }
};