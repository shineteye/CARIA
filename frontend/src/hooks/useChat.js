import { useState, useCallback, useEffect, useRef } from 'react';
import { createSession, sendMessage as sendMessageApi, getSessionHistory } from '../services/api';

const SESSION_KEY = 'Caria_session_id';

export default function useChat(onRoadmapUpdate) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const onRoadmapUpdateRef = useRef(onRoadmapUpdate);
  onRoadmapUpdateRef.current = onRoadmapUpdate;

  useEffect(() => {
    let cancelled = false;

    async function initSession() {
      const storedId = localStorage.getItem(SESSION_KEY);

      if (storedId) {
        try {
          const history = await getSessionHistory(storedId);
          if (!cancelled) {
            setSessionId(storedId);
            if (Array.isArray(history)) {
              setMessages(history);
            }
            setSessionReady(true);
            return;
          }
        } catch {
          localStorage.removeItem(SESSION_KEY);
        }
      }

      try {
        const { sessionId: newId } = await createSession();
        if (!cancelled) {
          localStorage.setItem(SESSION_KEY, newId);
          setSessionId(newId);
        }
      } catch {
        /* backend not available yet */
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    }

    initSession();
    return () => { cancelled = true; };
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!sessionId || isLoading) return;

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { reply, roadmapUpdate } = await sendMessageApi(sessionId, text);

      const agentMessage = {
        role: 'agent',
        content: reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, agentMessage]);

      if (roadmapUpdate) {
        onRoadmapUpdateRef.current?.(roadmapUpdate);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: 'Sorry, I couldn\'t reach the server. Please try again in a moment.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading]);

  return { messages, isLoading, sendMessage, sessionId, sessionReady };
}
