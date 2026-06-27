import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  headers: { 'Content-Type': 'application/json' },
});

export async function createSession() {
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
