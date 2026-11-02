import axios from "axios";

const TOKEN_KEY = "Caria_auth_token";

const api = axios.create({
  // "" keeps requests on the current origin. In dev the Vite server proxies /api
  // to the backend (see vite.config.js); in production vercel.json routes /api to
  // the backend service. Staying relative also means the app works through an
  // ngrok tunnel or from a phone on the LAN, where "localhost" would resolve to
  // the visitor's own machine.
  baseURL: import.meta.env.VITE_API_URL || "",
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

// sessionId lets a guest's onboarding answers carry into the new account.
export async function register(name, email, password, sessionId) {
  const { data } = await api.post("/api/auth/register", {
    name,
    email,
    password,
    sessionId,
  });
  return data;
}

export async function login(email, password, sessionId) {
  const { data } = await api.post("/api/auth/login", {
    email,
    password,
    sessionId,
  });
  return data;
}

export async function unlockGuide(sessionId) {
  const { data } = await api.post("/api/chat/unlock-guide", { sessionId });
  return data;
}

export async function rebuildPlan(sessionId) {
  const { data } = await api.post("/api/chat/rebuild-plan", { sessionId });
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

/* ── Full-screen onboarding ──────────────────────────────────────────────
   Separate from /api/chat/message: the wizard advances the same state machine
   without writing the student's raw answers into their conversation history. */

export async function getOnboardingState(sessionId) {
  const { data } = await api.get(`/api/onboarding/${sessionId}`);
  return data;
}

export async function answerOnboarding(sessionId, answer) {
  const { data } = await api.post("/api/onboarding/answer", {
    sessionId,
    answer,
  });
  return data;
}

/** Rewind to an earlier question. Forward moves must go through answering. */
export async function setOnboardingStep(sessionId, step) {
  const { data } = await api.post("/api/onboarding/step", { sessionId, step });
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

export async function getCareerRecommendations() {
  const { data } = await api.get("/api/careers/recommendations");
  return data;
}

/** Public catalogue — no account needed. */
export async function getAllCareers() {
  const { data } = await api.get("/api/careers");
  return data;
}

export async function compareCareers(careerIds) {
  const { data } = await api.post("/api/careers/compare", { careerIds });
  return data;
}

export default api;
