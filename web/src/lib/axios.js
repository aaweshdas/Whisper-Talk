import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;
if (!apiUrl) {
  console.error("VITE_API_URL environment variable is not set");
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
});

// Auto-attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("whisper_jwt");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
