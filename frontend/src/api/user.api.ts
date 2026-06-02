import request from "./client";

export const getProfile = async () => {
  const res = await request("/users/profile");
  return res.data;
};

export const updateProfile = async (data: {
  name?: string;
  designation?: string;
  avatar?: string;
}) => {
  const res = await request("/users/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
};

export const changePassword = async (data: {
  current_password: string;
  new_password: string;
}) => {
  const res = await request("/users/change-password", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
};