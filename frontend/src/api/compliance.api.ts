import request from "./client";

export const runComplianceCheck = async (
  projectId: string,
  data: { file_id?: string; is_code: string; member_type?: string }
) => {
  const res = await request(`/projects/${projectId}/compliance`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
};

export const getComplianceChecks = async (projectId: string, page = 1, limit = 20) => {
  const res = await request(`/projects/${projectId}/compliance?page=${page}&limit=${limit}`);
  return res;
};

export const getComplianceCheck = async (projectId: string, checkId: string) => {
  const res = await request(`/projects/${projectId}/compliance/${checkId}`);
  return res.data;
};