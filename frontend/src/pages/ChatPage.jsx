import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useChat from "../hooks/useChat";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import { GuideDocument } from "../components/chat/ChatBubble";
import ProfileEditor from "../components/chat/ProfileEditor";
import PlanRail from "../components/advisor/PlanRail";
import AppHeader from "../components/layout/AppHeader";
import { stageInfo } from "../lib/stage";

/**
 * The advisor workspace. The plan is the home view — the student's standing
 * document — and the conversation is where they consult on it. Keeping them
 * apart is what stops this reading as a chatbot with a long first message.
 */
export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const askParam = params.get("ask");

  const [sidebarGoal, setSidebarGoal] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [answersChanged, setAnswersChanged] = useState(false);
  const [view, setView] = useState(askParam ? "advisor" : "plan");
  const [prefill, setPrefill] = useState(askParam || "");

  const handleMetaUpdate = useCallback((meta) => {
    if (meta?.careerGoal) setSidebarGoal(meta.careerGoal);
    if (meta?.roadmapUpdate?.careerGoal) setSidebarGoal(meta.roadmapUpdate.careerGoal);
  }, []);

  const {
    messages,
    isLoading,
    sendMessage,
    rebuildPlan,
    sessionId,
    sessionReady,
    phase,
    profile,
    careerGoal,
    unlockGuide,
    beginClaim,
    setProfileLocal,
  } = useChat(handleMetaUpdate);

  const displayGoal = sidebarGoal || careerGoal;
  const stage = stageInfo(profile?.educationLevel);
  const inputDisabled = !sessionId || isLoading;

  const latestPlan = useMemo(
    () => [...messages].reverse().find((m) => m.kind === "guide") || null,
    [messages],
  );
  const hasConversation = messages.some((m) => m.role === "user");

  // Arriving straight from sign-up. Claim session state synchronously on the
  // very first render so the init effect in useChat — which re-runs the moment
  // isAuthenticated flips — can't reset the session while the guide is being
  // generated.
  const claimingSignup = !!location.state?.unlock;
  const unlockedRef = useRef(false);
  if (claimingSignup && !unlockedRef.current) beginClaim();

  // Onboarding lives on its own full-screen route. Anyone who lands here
  // mid-profile (a bookmark, a refresh, a stale tab) belongs back in it — but
  // not the student who just signed up, whose phase is still awaiting_signup
  // until the guide finishes generating.
  useEffect(() => {
    if (!sessionReady || claimingSignup || unlockedRef.current) return;
    if (phase === "onboarding" || phase === "awaiting_signup") {
      navigate("/start", { replace: true });
    }
  }, [sessionReady, phase, claimingSignup, navigate]);

  useEffect(() => {
    if (!claimingSignup || unlockedRef.current) return;
    if (!sessionId || !sessionReady) return;
    unlockedRef.current = true;
    setView("plan");
    unlockGuide(sessionId);
    // Clear the flag so a refresh doesn't try to unlock an already-built guide.
    navigate(location.pathname, { replace: true, state: {} });
  }, [claimingSignup, location.pathname, sessionId, sessionReady, unlockGuide, navigate]);

  // The ?ask= handover is consumed once; drop it so a refresh doesn't refill.
  useEffect(() => {
    if (askParam) navigate(location.pathname, { replace: true, state: location.state });
  }, [askParam, location.pathname, location.state, navigate]);

  const consult = (question) => {
    if (inputDisabled) return;
    setView("advisor");
    sendMessage(question);
  };

  const handleRebuild = async () => {
    const ok = await rebuildPlan();
    if (ok) {
      setAnswersChanged(false);
      setView("plan");
    }
  };

  const rail = (
    <PlanRail
      stage={stage}
      profile={profile}
      careerGoal={displayGoal}
      onEditProfile={() => setEditorOpen(true)}
    />
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white" style={{ fontFamily: "var(--font-body)" }}>
      <AppHeader onAvatarClick={() => setEditorOpen(true)} variant="cream" />

      {!sessionReady && (
        <div className="px-6 py-2 text-center text-[13px] bg-gold-faint text-navy border-b border-gold/20 shrink-0">
          Loading your workspace…
        </div>
      )}
      {sessionReady && !sessionId && (
        <div className="px-6 py-2 text-center text-[13px] bg-red-50 text-red-700 border-b border-red-100 shrink-0">
          Could not reach the server. Please refresh the page.
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ════ Plan rail — desktop ════ */}
        <aside className="hidden lg:block w-[300px] shrink-0 overflow-y-auto border-r border-border bg-cream">
          {rail}
        </aside>

        {/* ════ Workspace ════ */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="shrink-0 border-b border-border bg-white">
            <div className="max-w-[820px] mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
                  {stage.label}
                </p>
                <p className="text-[15px] text-navy font-medium truncate">
                  {displayGoal || "Your guidance workspace"}
                </p>
              </div>
              <div role="tablist" aria-label="Workspace view" className="flex shrink-0 rounded-full bg-cream border border-border p-1">
                {[
                  ["plan", "Plan"],
                  ["advisor", "Advisor"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={view === key}
                    onClick={() => setView(key)}
                    className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                      view === key ? "bg-navy text-white" : "text-fg-soft hover:text-navy"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {view === "plan" ? (
            <PlanView
              plan={latestPlan}
              stage={stage}
              isLoading={isLoading}
              canBuild={phase === "chat" && !!sessionId}
              answersChanged={answersChanged}
              onRebuild={handleRebuild}
              onConsult={consult}
              rail={rail}
            />
          ) : (
            <>
              <ChatWindow
                messages={messages}
                isLoading={isLoading}
                onOpenPlan={() => setView("plan")}
                intro={!hasConversation && <AdvisorIntro stage={stage} onPick={consult} disabled={inputDisabled} />}
              />

              {hasConversation && (
                <div className="shrink-0 border-t border-border bg-white">
                  <div className="max-w-[760px] mx-auto px-4 sm:px-6 md:px-8 pt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {stage.topics.map(({ q }) => (
                      <button
                        key={q}
                        onClick={() => consult(q)}
                        disabled={inputDisabled}
                        className="shrink-0 px-3.5 py-1.5 rounded-full border border-border text-[12px] text-fg-soft bg-white hover:border-navy hover:text-navy transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <ChatInput
                onSend={sendMessage}
                isLoading={isLoading}
                disabled={!sessionId}
                prefill={prefill}
                placeholder="Ask your advisor a question…"
                hint="Advice is based on your answers and published cut-offs. Confirm dates and requirements with the institution."
              />
            </>
          )}
        </div>
      </div>

      <ProfileEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialProfile={profile}
        onSaved={(data) => {
          setProfileLocal(data.profile, data.careerGoal);
          setAnswersChanged(true);
          setPrefill("");
        }}
      />
    </div>
  );
}

/* ─── Plan view ─────────────────────────────────────────── */

function PlanView({ plan, stage, isLoading, canBuild, answersChanged, onRebuild, onConsult, rail }) {
  return (
    <div className="flex-1 overflow-y-auto bg-cream/40">
      <div className="max-w-[820px] mx-auto px-4 sm:px-6 md:px-8 py-8 flex flex-col gap-6">
        {answersChanged && plan && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold-faint px-4 py-3">
            <p className="text-[13px] text-navy">Your answers changed since this plan was written.</p>
            <button
              type="button"
              onClick={onRebuild}
              disabled={isLoading}
              className="text-[13px] font-semibold text-navy underline underline-offset-2 hover:text-gold disabled:opacity-50"
            >
              {isLoading ? "Rebuilding…" : "Rebuild plan"}
            </button>
          </div>
        )}

        {plan ? (
          <GuideDocument
            content={plan.content}
            timestamp={plan.timestamp}
            headerAction={
              <button
                type="button"
                onClick={onRebuild}
                disabled={isLoading}
                className="shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-full border border-white/25 text-white/85 hover:bg-white/10 disabled:opacity-50"
              >
                {isLoading ? "Rebuilding…" : "Rebuild"}
              </button>
            }
          />
        ) : (
          <EmptyPlan isLoading={isLoading} canBuild={canBuild} onBuild={onRebuild} />
        )}

        {plan && (
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted mb-3">
              Discuss this plan with your advisor
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {stage.topics.map(({ q, d }) => (
                <TopicCard key={q} q={q} d={d} onPick={onConsult} disabled={isLoading} />
              ))}
            </div>
          </section>
        )}

        {/* Below lg the rail has no column of its own; it continues the plan. */}
        <div className="lg:hidden rounded-2xl border border-border bg-cream">{rail}</div>
      </div>
    </div>
  );
}

function EmptyPlan({ isLoading, canBuild, onBuild }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-10 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold mb-2">Guidance plan</p>
      <h2 className="text-xl text-navy mb-2" style={{ fontFamily: "var(--font-display)" }}>
        {isLoading ? "Building your plan…" : "No plan in this workspace yet"}
      </h2>
      <p className="text-[14px] text-fg-soft max-w-[46ch] mx-auto mb-5">
        Your plan sets out where you stand, the direction that fits you, the steps from your current stage, and what to do in
        the next few weeks.
      </p>
      {canBuild && !isLoading && (
        <button
          type="button"
          onClick={onBuild}
          className="px-6 py-2.5 rounded-full bg-navy text-white text-[14px] font-semibold hover:bg-navy-light transition-colors"
        >
          Build my plan
        </button>
      )}
    </div>
  );
}

/* ─── Advisor view ──────────────────────────────────────── */

function TopicCard({ q, d, onPick, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onPick(q)}
      disabled={disabled}
      className="text-left rounded-xl border border-border bg-white px-4 py-3 hover:border-navy hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <p className="text-[14px] text-navy font-medium leading-snug">{q}</p>
      <p className="text-[12px] text-fg-muted mt-0.5">{d}</p>
    </button>
  );
}

function AdvisorIntro({ stage, onPick, disabled }) {
  return (
    <section className="pb-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold mb-1.5">Advisor</p>
      <h2 className="text-2xl text-navy leading-snug mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
        Ask about any part of your path
      </h2>
      <p className="text-[14px] text-fg-soft mb-5 max-w-[56ch]">
        Answers are tailored to your stage ({stage.label}) and your answers. Common questions at your stage:
      </p>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {stage.topics.map(({ q, d }) => (
          <TopicCard key={q} q={q} d={d} onPick={onPick} disabled={disabled} />
        ))}
      </div>
    </section>
  );
}
