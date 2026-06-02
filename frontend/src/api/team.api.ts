import request from "./client";

export const inviteMember = async (
  projectId: string,
  data: { email: string; role?: string }
) => {
  const res = await request(`/projects/${projectId}/team/invite`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
};

export const getTeam = async (projectId: string) => {
  const res = await request(`/projects/${projectId}/team`);
  return res.data;
};

export const updateMemberRole = async (
  projectId: string,
  memberId: string,
  role: string
) => {
  const res = await request(`/projects/${projectId}/team/${memberId}`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
  return res.data;
};

export const removeMember = async (projectId: string, memberId: string) => {
  await request(`/projects/${projectId}/team/${memberId}`, { method: "DELETE" });
};