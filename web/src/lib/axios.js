import axios from "axios";

const api = axios.create({
  baseURL: "https://whisper-ijeje.sevalla.app/api",
  withCredentials: true,
});

export default api;
