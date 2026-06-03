const BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5000" 
  : "https://civilos.onrender.com";

const getToken = () => localStorage.getItem("civilos_token");

export const setToken = (token: string) => localStorage.setItem("civilos_token", token);
export const setRefreshToken = (token: string) => localStorage.setItem("civilos_refresh", token);
export const getRefreshToken = () => localStorage.getItem("civilos_refresh");
export const clearTokens = () => {
  localStorage.removeItem("civilos_token");
  localStorage.removeItem("civilos_refresh");
  localStorage.removeItem("civilos_project");
};

export const setCurrentProject = (id: string) => localStorage.setItem("civilos_project", id);
export const getCurrentProject = () => localStorage.getItem("civilos_project");

const request = async (path: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

export default request;