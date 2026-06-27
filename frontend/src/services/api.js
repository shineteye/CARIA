import axios from 'axios';

// Detect if we are running in production on Vercel
const isProduction = import.meta.env.PROD;

const api = axios.create({
  // Dev: local Express server. Production: Vercel's routing prefix
  baseURL: import.meta.env.VITE_API_URL || (isProduction ? '/_/backend' : 'http://localhost:5001'),
  headers: { 'Content-Type': 'application/json' },
});

export async function createSession() {
  // This will now hit /_/backend/api/session/create in production
  const { data } = await api.post('/api/session/create');
  return data;
}

export async function sendMessage(sessionId, message) {
  const { data } = await api.post('/api/chat/message', { sessionId, message });
  return data;
}

export async function getSessionHistory(sessionId) {
  const { data } = await api.get(`/api/session/${sessionId}/history`);
  return data;
}

export default api;
