import request from "./client";

export const extractMembers = async (projectId: string) => {
  const res = await request(`/extract/${projectId}/members`);
  return res.data;
};