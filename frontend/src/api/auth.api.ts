import request, { setToken, setRefreshToken, clearTokens } from "./client";

export const register = async (data: {
  name: string;
  email: string;
  password: string;
  designation?: string;
}) => {
  const res = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setToken(res.data.access_token);
  setRefreshToken(res.data.refresh_token);
  return res.data;
};

export const login = async (data: { email: string; password: string }) => {
  const res = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setToken(res.data.access_token);
  setRefreshToken(res.data.refresh_token);
  return res.data;
};

export const logout = async () => {
  await request("/auth/logout", { method: "POST" });
  clearTokens();
};

export const getMe = async () => {
  const res = await request("/auth/me");
  return res.data;
};