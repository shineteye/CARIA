import { useState, useCallback, useEffect, useRef } from "react";
import {
  createSession,
  sendMessage as sendMessageApi,
  getSessionHistory,
  unlockGuide as unlockGuideApi,
  rebuildPlan as rebuildPlanApi,
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
  const [signupPreview, setSignupPreview] = useState(null);

  const onMetaUpdateRef = useRef(onMetaUpdate);
  onMetaUpdateRef.current = onMetaUpdate;

  // True from sign-up until the guide finishes generating.
  const claimingRef = useRef(false);

  const applyMeta = useCallback((data) => {
    if (data.phase) setPhase(data.phase);
    if (data.onboarding !== undefined) setOnboarding(data.onboarding);
    if (data.profile) setProfile(data.profile);
    if (data.careerGoal !== undefined && data.careerGoal !== null) {
      setCareerGoal(data.careerGoal);
    }
    if (data.guideReady !== undefined) setGuideReady(!!data.guideReady);
    if (data.signupPreview !== undefined) setSignupPreview(data.signupPreview);

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
    // Signing up flips isAuthenticated, which would otherwise re-run this and
    // clobber the guide we're in the middle of unlocking. The claim + unlock
    // path owns session state while it runs.
    if (claimingRef.current) return;

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

        // A guest finishing onboarding gets no reply — the signup prompt takes
        // the conversation's place until they have an account.
        if (data.reply) {
          setMessages((prev) => [
            ...prev,
            {
              role: "agent",
              content: data.reply,
              kind: data.replyKind || "message",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
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

  /**
   * Claim ownership of session state BEFORE signing up.
   *
   * Registering flips isAuthenticated, which re-runs the init effect above. If
   * the guard is only set once unlockGuide starts, that re-run races the unlock
   * and can reset the session out from under it — the student signs up and
   * lands in a chat with no guide. Setting it synchronously up front closes the
   * window.
   */
  const beginClaim = useCallback(() => {
    claimingRef.current = true;
  }, []);

  /**
   * Called immediately after a guest signs up: their session is now claimed, so
   * generate the guide they've already earned.
   */
  const unlockGuide = useCallback(
    async (claimedSessionId) => {
      const id = claimedSessionId || sessionId;
      if (!id) return;
      // Already set synchronously by beginClaim before sign-up; setting it again
      // is harmless and covers callers that skip that step.
      claimingRef.current = true;
      setSessionId(id);
      localStorage.setItem(SESSION_KEY, id);
      setSignupPreview(null);
      setIsLoading(true);
      try {
        const data = await unlockGuideApi(id);
        if (data.reply) {
          setMessages((prev) => [
            ...prev,
            {
              role: "agent",
              content: data.reply,
              kind: data.replyKind || "message",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
        applyMeta(data);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "agent",
            content:
              err?.response?.data?.error ||
              "Your account is ready, but I couldn't build the guide just now. Ask me anything and we'll pick it up from there.",
            timestamp: new Date().toISOString(),
          },
        ]);
        setPhase("chat");
      } finally {
        setIsLoading(false);
        claimingRef.current = false;
      }
    },
    [sessionId, applyMeta],
  );

  /** Writes a new plan from the current profile; it becomes the latest one. */
  const rebuildPlan = useCallback(async () => {
    if (!sessionId || isLoading) return false;
    setIsLoading(true);
    try {
      const data = await rebuildPlanApi(sessionId);
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "agent",
            content: data.reply,
            kind: "guide",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
      applyMeta(data);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading, applyMeta]);

  return {
    messages,
    isLoading,
    sendMessage,
    rebuildPlan,
    sessionId,
    sessionReady,
    phase,
    onboarding,
    profile,
    careerGoal,
    guideReady,
    signupPreview,
    unlockGuide,
    beginClaim,
    startFreshOnboarding,
    setProfileLocal,
  };
}
