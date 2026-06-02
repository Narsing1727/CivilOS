import request from "./client";

export const sendMessage = async (projectId: string, content: string) => {
  const res = await request(`/projects/${projectId}/chat`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  return res.data;
};

export const getMessages = async (projectId: string, page = 1, limit = 50) => {
  const res = await request(`/projects/${projectId}/chat?page=${page}&limit=${limit}`);
  return res;
};

export const clearChatHistory = async (projectId: string) => {
  await request(`/projects/${projectId}/chat`, { method: "DELETE" });
};