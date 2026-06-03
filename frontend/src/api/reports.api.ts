import request from "./client";

export const generateReport = async (
  projectId: string,
  data: { title: string; type?: string }
) => {
  const res = await request(`/projects/${projectId}/reports`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
};

export const getReports = async (projectId: string, page = 1, limit = 20) => {
  const res = await request(`/projects/${projectId}/reports?page=${page}&limit=${limit}`);
  return res;
};

export const getReport = async (projectId: string, reportId: string) => {
  const res = await request(`/projects/${projectId}/reports/${reportId}`);
  return res.data;
};

export const downloadReportUrl = (projectId: string, reportId: string) => {
  const BASE = window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://civilos.onrender.com";
  return `${BASE}/api/v1/projects/${projectId}/reports/${reportId}/download`;
};