import { useState, useCallback, useEffect, useRef } from "react";
import {
  createSession,
  sendMessage as sendMessageApi,
  getSessionHistory,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

const SESSION_KEY = "Caria_session_id";

export default function useChat(onMetaUpdate) {
  const { isAuthenticated, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [phase, setPhase] = useState("onboarding");
  const [onboarding, setOnboarding] = useState(null);
  const [profile, setProfile] = useState(null);
  const [careerGoal, setCareerGoal] = useState(null);
  const [guideReady, setGuideReady] = useState(false);

  const onMetaUpdateRef = useRef(onMetaUpdate);
  onMetaUpdateRef.current = onMetaUpdate;

  const applyMeta = useCallback((data) => {
    if (data.phase) setPhase(data.phase);
    if (data.onboarding !== undefined) setOnboarding(data.onboarding);
    if (data.profile) setProfile(data.profile);
    if (data.careerGoal !== undefined && data.careerGoal !== null) {
      setCareerGoal(data.careerGoal);
    }
    if (data.guideReady !== undefined) setGuideReady(!!data.guideReady);

    onMetaUpdateRef.current?.({
      phase: data.phase,
      onboarding: data.onboarding,
      profile: data.profile,
      careerGoal: data.careerGoal,
      guideReady: data.guideReady,
      roadmapUpdate: data.roadmapUpdate,
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setSessionReady(true);
      return;
    }

    let cancelled = false;

    async function initSession() {
      setSessionReady(false);
      const storedId = localStorage.getItem(SESSION_KEY);

      if (storedId) {
        try {
          const history = await getSessionHistory(storedId);
          if (!cancelled) {
            setSessionId(storedId);
            if (Array.isArray(history.messages)) {
              setMessages(history.messages);
            }
            applyMeta(history);
            setSessionReady(true);
            return;
          }
        } catch {
          localStorage.removeItem(SESSION_KEY);
        }
      }

      try {
        const created = await createSession(false);
        if (!cancelled) {
          localStorage.setItem(SESSION_KEY, created.sessionId);
          setSessionId(created.sessionId);
          if (Array.isArray(created.messages)) {
            setMessages(created.messages);
          }
          applyMeta(created);
        }
      } catch {
        /* backend not available */
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    }

    initSession();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token, applyMeta]);

  const sendMessage = useCallback(
    async (text) => {
      if (!sessionId || isLoading) return;

      const trimmed = (text || "").trim();
      if (!trimmed) return;

      const userMessage = {
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const data = await sendMessageApi(sessionId, trimmed);

        const agentMessage = {
          role: "agent",
          content: data.reply,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, agentMessage]);
        applyMeta(data);
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          "Sorry, I couldn't reach the server. Please try again in a moment.";
        setMessages((prev) => [
          ...prev,
          {
            role: "agent",
            content: msg,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading, applyMeta],
  );

  const startFreshOnboarding = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY);
    setMessages([]);
    setIsLoading(true);
    try {
      const created = await createSession(true);
      localStorage.setItem(SESSION_KEY, created.sessionId);
      setSessionId(created.sessionId);
      setMessages(created.messages || []);
      applyMeta(created);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, [applyMeta]);

  const setProfileLocal = useCallback((nextProfile, nextGoal) => {
    if (nextProfile) setProfile(nextProfile);
    if (nextGoal !== undefined) setCareerGoal(nextGoal);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    sessionId,
    sessionReady,
    phase,
    onboarding,
    profile,
    careerGoal,
    guideReady,
    startFreshOnboarding,
    setProfileLocal,
  };
}
