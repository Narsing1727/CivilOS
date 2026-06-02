import request from "./client";

export const addMemory = async (
  projectId: string,
  data: { title: string; content: string; type?: string; tags?: string[]; source_file_id?: string }
) => {
  const res = await request(`/projects/${projectId}/memory`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
};

export const getMemories = async (projectId: string, page = 1, limit = 20, type?: string) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (type) params.append("type", type);
  const res = await request(`/projects/${projectId}/memory?${params}`);
  return res;
};

export const searchMemory = async (projectId: string, query: string) => {
  const res = await request(`/projects/${projectId}/memory/search`, {
    method: "POST",
    body: JSON.stringify({ query }),
  });
  return res.data;
};

export const deleteMemory = async (projectId: string, memoryId: string) => {
  await request(`/projects/${projectId}/memory/${memoryId}`, { method: "DELETE" });
};