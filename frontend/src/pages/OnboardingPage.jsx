import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useOnboarding from "../hooks/useOnboarding";
import { useAuth } from "../context/AuthContext";
import OnboardingProgress from "../components/onboarding/OnboardingProgress";
import OnboardingStep from "../components/onboarding/OnboardingStep";
import OnboardingIntro from "../components/onboarding/OnboardingIntro";
import OnboardingComplete from "../components/onboarding/OnboardingComplete";
import logo from "../assets/logo.svg";

/**
 * Full-screen onboarding — the wizard, not the chat.
 *
 * Nothing here scrolls behind a transcript and there is no composer: one
 * question owns the viewport at a time. The student only reaches the chat page
 * once their profile is complete, so the first thing they ever read there is
 * their own guide.
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [started, setStarted] = useState(false);

  const {
    sessionId,
    question,
    progress,
    answers,
    phase,
    careerGoal,
    signupPreview,
    ready,
    busy,
    error,
    submit,
    goBack,
    canGoBack,
  } = useOnboarding();

  // A signed-in student who finishes has nothing left to fill in here — the
  // chat page generates their guide on arrival.
  useEffect(() => {
    if (phase === "chat") navigate("/chat", { replace: true });
  }, [phase, navigate]);

  // Someone who already finished shouldn't be able to walk back into the wizard.
  useEffect(() => {
    if (ready && phase === "awaiting_signup" && isAuthenticated) {
      navigate("/chat", { replace: true });
    }
  }, [ready, phase, isAuthenticated, navigate]);

  const handleClaimed = () => {
    // The chat page picks the session up and unlocks the guide.
    navigate("/chat", { replace: true, state: { unlock: true } });
  };

  const done = phase === "awaiting_signup";
  const showIntro = !started && !done && progress.step === 1;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-cream" style={{ fontFamily: "var(--font-body)" }}>
      {/* Minimal chrome — a way out, and nothing else to click. */}
      <header className="shrink-0 px-5 sm:px-8 py-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5"
          aria-label="Back to home"
        >
          <img src={logo} alt="" className="w-7 h-7" />
          <span
            className="text-[17px] text-navy font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Caria
          </span>
        </button>

        {!done && (
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-[13px] text-fg-muted hover:text-navy transition-colors"
          >
            Save &amp; exit
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-6">
        <div className="w-full max-w-[680px]">
          {error && (
            <p className="mb-6 text-[14px] text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {!ready && (
            <p className="text-[15px] text-fg-muted">Connecting to Caria…</p>
          )}

          {ready && showIntro && (
            <OnboardingIntro
              total={progress.total}
              onStart={() => setStarted(true)}
              disabled={!sessionId}
            />
          )}

          {ready && done && (
            <OnboardingComplete
              preview={signupPreview}
              sessionId={sessionId}
              careerGoal={careerGoal}
              onClaimed={handleClaimed}
            />
          )}

          {ready && !showIntro && !done && question && (
            <>
              <div className="mb-9">
                <OnboardingProgress
                  step={progress.step}
                  total={progress.total}
                  onBack={goBack}
                  canGoBack={canGoBack && !busy}
                />
              </div>

              {/* Keyed on the question so each screen mounts fresh and the
                  entrance animation replays on every advance. */}
              <div key={question.id} className="animate-[fadeUp_320ms_ease-out]">
                <OnboardingStep
                  question={question}
                  priorAnswer={answers[question.id]}
                  onSubmit={submit}
                  disabled={busy || !sessionId}
                />
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="shrink-0 px-5 sm:px-8 py-5 text-center">
        <p className="text-[12px] text-fg-muted">
          Your answers shape every recommendation Caria makes.
        </p>
      </footer>
    </div>
  );
}
