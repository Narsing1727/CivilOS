import request, { getCurrentProject } from "./client";

export const createProject = async (data: {
  name: string;
  type?: string;
  description?: string;
}) => {
  const res = await request("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
};

export const getProjects = async (page = 1, limit = 20) => {
  const res = await request(`/projects?page=${page}&limit=${limit}`);
  return res;
};

export const getProject = async (projectId: string) => {
  const res = await request(`/projects/${projectId}`);
  return res.data;
};

export const updateProject = async (projectId: string, data: object) => {
  const res = await request(`/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
};

export const deleteProject = async (projectId: string) => {
  await request(`/projects/${projectId}`, { method: "DELETE" });
};

export const getProjectSnapshot = async (projectId: string) => {
  const res = await request(`/projects/${projectId}/snapshot`);
  return res.data;
};

export const getActivityFeed = async (projectId: string, page = 1, limit = 20) => {
  const res = await request(`/projects/${projectId}/activity?page=${page}&limit=${limit}`);
  return res;
};

export const getTeamMembers = (projectId: string) => request(`/projects/${projectId}/team`);
export const getActivity = (projectId: string) => request(`/projects/${projectId}/activity`);