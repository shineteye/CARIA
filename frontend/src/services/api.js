import axios from "axios";

const isProduction = import.meta.env.PROD;
const TOKEN_KEY = "Caria_auth_token";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (isProduction ? "/_/backend" : "http://localhost:5001"),
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function register(name, email, password) {
  const { data } = await api.post("/api/auth/register", {
    name,
    email,
    password,
  });
  return data;
}

export async function login(email, password) {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get("/api/auth/me");
  return data;
}

export async function logout() {
  const { data } = await api.post("/api/auth/logout");
  return data;
}

export async function createSession(forceNew = false) {
  const { data } = await api.post("/api/session/create", { forceNew });
  return data;
}

export async function sendMessage(sessionId, message) {
  const { data } = await api.post("/api/chat/message", { sessionId, message });
  return data;
}

export async function getSessionHistory(sessionId) {
  const { data } = await api.get(`/api/session/${sessionId}/history`);
  if (Array.isArray(data)) {
    return {
      messages: data,
      phase: data.length ? "chat" : "onboarding",
      onboarding: null,
      profile: null,
      careerGoal: null,
      guideReady: false,
    };
  }
  return data;
}

export async function getProfile() {
  const { data } = await api.get("/api/profile");
  return data;
}

export async function updateProfile(profile) {
  const { data } = await api.put("/api/profile", { profile });
  return data;
}

export default api;
