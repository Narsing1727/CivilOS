import request from "./client";

export const uploadFiles = async (
  projectId: string,
  files: FileList | File[],
  category = "other"
) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));
  formData.append("category", category);

  const res = await request(`/projects/${projectId}/files`, {
    method: "POST",
    body: formData,
  });
  return res.data;
};

export const getFiles = async (projectId: string, page = 1, limit = 20, filters: Record<string, string> = {}) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), ...filters });
  const res = await request(`/projects/${projectId}/files?${params}`);
  return res;
};

export const getFile = async (projectId: string, fileId: string) => {
  const res = await request(`/projects/${projectId}/files/${fileId}`);
  return res.data;
};

export const deleteFile = async (projectId: string, fileId: string) => {
  await request(`/projects/${projectId}/files/${fileId}`, { method: "DELETE" });
};

export const getFileParseStatus = async (projectId: string, fileId: string) => {
  const res = await request(`/projects/${projectId}/files/${fileId}/status`);
  return res.data;
};

export const getFileChunks = async (projectId: string, fileId: string) => {
  const res = await request(`/projects/${projectId}/files/${fileId}/chunks`);
  return res;
};