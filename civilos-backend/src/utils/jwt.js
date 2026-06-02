import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
};

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET);
};