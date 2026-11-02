import { useState, useEffect, useCallback, useRef } from "react";
import {
  createSession,
  getOnboardingState,
  answerOnboarding,
  setOnboardingStep,
} from "../services/api";

const SESSION_KEY = "Caria_session_id";

/**
 * State for the full-screen onboarding wizard.
 *
 * Deliberately separate from useChat: the wizard has no transcript, no agent
 * replies and no LLM calls, so sharing that hook would mean carrying a message
 * list and a loading flag that mean something different here. The two meet only
 * at the session id, which both read from localStorage.
 */
export default function useOnboarding() {
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [progress, setProgress] = useState({ step: 1, total: 12 });
  const [answers, setAnswers] = useState({});
  const [phase, setPhase] = useState("onboarding");
  const [signupPreview, setSignupPreview] = useState(null);
  const [profile, setProfile] = useState(null);
  const [careerGoal, setCareerGoal] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Guards the first-load effect against React 18 StrictMode's double-invoke,
  // which would otherwise create two guest sessions and strand the first.
  const initialisedRef = useRef(false);

  const applyState = useCallback((data) => {
    if (!data) return;
    if (data.phase) setPhase(data.phase);
    if (data.onboarding) {
      setQuestion(data.onboarding.question || null);
      setProgress({
        step: data.onboarding.step,
        total: data.onboarding.total,
      });
    }
    if (data.answers) setAnswers(data.answers);
    if (data.profile) setProfile(data.profile);
    if (data.careerGoal !== undefined) setCareerGoal(data.careerGoal);
    if (data.signupPreview) setSignupPreview(data.signupPreview);
  }, []);

  useEffect(() => {
    if (initialisedRef.current) return;
    initialisedRef.current = true;

    // No cancelled flag here, deliberately. The ref already guarantees init()
    // runs once, so under StrictMode's mount/unmount/remount the cleanup would
    // cancel the ONLY run in flight while the remount declines to start another
    // — leaving `ready` false forever on the "Connecting to Caria…" screen.
    // Session creation is a real side effect we want to keep, not abandon.
    async function init() {
      const storedId = localStorage.getItem(SESSION_KEY);

      if (storedId) {
        try {
          const state = await getOnboardingState(storedId);
          setSessionId(storedId);
          applyState(state);
          setReady(true);
          return;
        } catch {
          // A stale or claimed session id — fall through and start fresh.
          localStorage.removeItem(SESSION_KEY);
        }
      }

      try {
        const created = await createSession(false);
        localStorage.setItem(SESSION_KEY, created.sessionId);
        setSessionId(created.sessionId);
        applyState(created);
      } catch {
        setError("Could not reach Caria. Check your connection and refresh.");
      } finally {
        setReady(true);
      }
    }

    init();
  }, [applyState]);

  const submit = useCallback(
    async (answer) => {
      const value = String(answer || "").trim();
      if (!sessionId || busy || !value) return;

      setBusy(true);
      setError(null);
      try {
        const data = await answerOnboarding(sessionId, value);
        applyState(data);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            "That didn't save. Check your connection and try again.",
        );
      } finally {
        setBusy(false);
      }
    },
    [sessionId, busy, applyState],
  );

  /** Step back one question. The answer stays on the profile until overwritten. */
  const goBack = useCallback(async () => {
    if (!sessionId || busy) return;
    const targetStep = progress.step - 2; // step is 1-indexed; server is 0-indexed
    if (targetStep < 0) return;

    setBusy(true);
    setError(null);
    try {
      const data = await setOnboardingStep(sessionId, targetStep);
      applyState(data);
    } catch (err) {
      setError(err?.response?.data?.error || "Couldn't go back just now.");
    } finally {
      setBusy(false);
    }
  }, [sessionId, busy, progress.step, applyState]);

  const canGoBack = progress.step > 1 && phase === "onboarding";

  return {
    sessionId,
    question,
    progress,
    answers,
    phase,
    profile,
    careerGoal,
    signupPreview,
    ready,
    busy,
    error,
    submit,
    goBack,
    canGoBack,
  };
}
