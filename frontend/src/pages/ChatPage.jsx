import { useCallback, useState } from "react";
import useChat from "../hooks/useChat";
import useRoadmap from "../hooks/useRoadmap";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import OnboardingProgress from "../components/chat/OnboardingProgress";
import SuggestionChips from "../components/chat/SuggestionChips";
import ProfileSummary from "../components/chat/ProfileSummary";
import ProfileEditor from "../components/chat/ProfileEditor";
import AppHeader from "../components/layout/AppHeader";

function getProgress(stages) {
  const pts = stages.reduce((sum, s) => {
    if (s.status === "complete") return sum + 1;
    if (s.status === "active") return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((pts / stages.length) * 100);
}

const ROADMAP_META = [
  { key: "JHS", label: "BECE Preparation", Icon: IcoGradCap },
  { key: "BECE", label: "SHS Selection (CSSPS)", Icon: IcoSchool },
  { key: "SHS", label: "WASSCE / Pre-Uni", Icon: IcoFlask },
  { key: "WASSCE", label: "University Admission", Icon: IcoBuilding },
  { key: "University", label: "Professional Degree", Icon: IcoDegree },
];

const CHAT_QUICK_REPLIES = [
  "Refine my roadmap for my grades",
  "What SHS stream fits me?",
  "How do I talk to my parents about this?",
  "University options if I miss top cutoffs",
];

export default function ChatPage() {
  const [sidebarGoal, setSidebarGoal] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const { stages, updateStage } = useRoadmap();
  const handleMetaUpdate = useCallback(
    (meta) => {
      if (meta?.roadmapUpdate) updateStage(meta.roadmapUpdate);
      if (meta?.careerGoal) setSidebarGoal(meta.careerGoal);
      if (meta?.roadmapUpdate?.careerGoal) {
        setSidebarGoal(meta.roadmapUpdate.careerGoal);
      }
    },
    [updateStage],
  );

  const {
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
    setProfileLocal,
  } = useChat(handleMetaUpdate);

  const displayGoal = sidebarGoal || careerGoal;
  const progress = getProgress(stages);
  const isOnboarding = phase === "onboarding";
  const currentQuestion = onboarding?.question || null;

  const handleQuickReply = (text) => {
    if (sessionId && !isLoading) sendMessage(text);
  };

  const handleNewSession = () => {
    localStorage.removeItem("Caria_session_id");
    window.location.reload();
  };

  const inputPlaceholder = isOnboarding
    ? currentQuestion?.placeholder || "Type a more detailed answer…"
    : "Ask a follow-up about your guide…";

  return (
    <div
      className="flex flex-col h-screen overflow-hidden bg-cream"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <AppHeader
        onNewSession={handleNewSession}
        onAvatarClick={() => setEditorOpen(true)}
        variant="cream"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ════ Chat Panel ════ */}
        <div className="flex flex-col flex-1 bg-white border-r border-border min-w-0">
          {!sessionReady && (
            <div className="px-6 py-2 text-center bg-gold-faint text-navy border-b border-border">
              Connecting to advisor…
            </div>
          )}
          {sessionReady && !sessionId && (
            <div className="px-6 py-2 text-center bg-red-50 text-red-700 border-b border-red-100">
              Could not reach server. Please refresh the page.
            </div>
          )}

          <OnboardingProgress onboarding={onboarding} phase={phase} />

          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            phase={phase}
          />

          {/* Onboarding chips OR free-chat quick replies */}
          {isOnboarding ? (
            <SuggestionChips
              question={currentQuestion}
              phase={phase}
              disabled={!sessionId || isLoading}
              onSelect={handleQuickReply}
            />
          ) : (
            <div className="flex gap-2 px-6 pb-3 flex-wrap">
              {CHAT_QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuickReply(q)}
                  disabled={!sessionId || isLoading}
                  className="px-4 py-2 rounded-full border border-border text-fg-soft bg-white hover:border-navy hover:text-navy transition-all duration-150 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed text-[13px]"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            disabled={!sessionId}
            placeholder={inputPlaceholder}
          />

          <p className="text-center text-[11px] py-2 px-4 shrink-0 text-fg-muted">
            {isOnboarding
              ? "Your answers stay in this session and shape your personal guide."
              : "Caria AI can make mistakes. Verify important academic deadlines."}
          </p>
        </div>

        {/* ════ Right Info Panel ════ */}
        <aside className="w-80 shrink-0 overflow-y-auto border-l border-border bg-cream p-5 flex flex-col gap-5">
          {/* Active Context */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-3 text-fg-muted">
              Active Context
            </p>
            <div className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white bg-navy shrink-0 text-sm">
                {displayGoal ? displayGoal.slice(0, 2).toUpperCase() : "?"}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-navy truncate">
                  {displayGoal ||
                    (isOnboarding ? "Discovering your path…" : "No goal set yet")}
                </p>
                <p className="text-xs text-fg-muted">
                  {isOnboarding ? "Onboarding in progress" : "Primary Career Goal"}
                </p>
              </div>
            </div>
          </div>

          {/* Live profile */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-3 text-fg-muted">
              About You
            </p>
            <ProfileSummary
              profile={profile}
              phase={phase}
              guideReady={guideReady}
              onEdit={!isOnboarding ? () => setEditorOpen(true) : undefined}
            />
          </div>

          {/* Roadmap Status */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-fg-muted">
                Roadmap Status
              </p>
              <p className="text-xs font-semibold text-navy">
                {progress}% Complete
              </p>
            </div>

            <div className="h-1.5 rounded-full mb-4 overflow-hidden bg-border">
              <div
                className="h-full rounded-full transition-all duration-500 bg-success"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex flex-col">
              {ROADMAP_META.map(({ key, label, Icon }, idx) => {
                const stageData = stages.find((s) => s.name === key) || {
                  status: "locked",
                };
                const isActive = stageData.status === "active";
                const isComplete = stageData.status === "complete";
                const isLocked = stageData.status === "locked";
                const isLast = idx === ROADMAP_META.length - 1;

                return (
                  <div key={key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-navy"
                            : isComplete
                              ? "bg-gold"
                              : "bg-gray-200"
                        }`}
                      >
                        <Icon
                          color={isLocked ? "#9ca3af" : "white"}
                          size={16}
                        />
                      </div>
                      {!isLast && (
                        <div
                          className={`w-px flex-1 my-1 ${isComplete ? "bg-gold" : "bg-gray-200"}`}
                          style={{ minHeight: 20 }}
                        />
                      )}
                    </div>
                    <div className="pb-4">
                      <p
                        className={`font-semibold leading-tight ${isLocked ? "text-gray-400" : "text-navy"}`}
                      >
                        {label}
                      </p>
                      <p className="text-[11px] mt-0.5 text-fg-muted">
                        {isActive
                          ? "In Progress"
                          : isComplete
                            ? "Complete"
                            : "Upcoming"}
                      </p>
                      {stageData.detail && !isLocked && (
                        <p className="text-[11px] mt-0.5 text-gold">
                          {stageData.detail}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status widget */}
          <div className="rounded-2xl p-4 mt-auto bg-navy">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`w-2 h-2 rounded-full ${sessionId ? "bg-green-400" : "bg-red-400"}`}
              />
              <span className="text-[11px] font-semibold text-white/70">
                Advisor Status
              </span>
            </div>
            <p className="font-semibold text-white mb-1">
              {!sessionId
                ? "Connecting…"
                : isOnboarding
                  ? "Learning about you"
                  : "Ready to help"}
            </p>
            <p className="text-[11px] leading-[1.5] text-white/50">
              {!sessionId
                ? "Waiting for a connection to the server."
                : isOnboarding
                  ? "Tap suggestions or type details — both work."
                  : "Your guide is ready. Ask follow-ups anytime."}
            </p>
          </div>
        </aside>
      </div>

      <ProfileEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialProfile={profile}
        onSaved={(data) => setProfileLocal(data.profile, data.careerGoal)}
      />
    </div>
  );
}

/* ─── Icon Set ────────────────────────────────────────────── */

function IcoGradCap({ color = "white", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 12v5c3 3 9 3 12 0v-5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IcoSchool({ color = "white", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 21h18M3 10h18M5 10V21M19 10V21M12 3L21 10H3L12 3Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IcoFlask({ color = "white", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M9 3h6M9 3v7L4 19a1 1 0 0 0 .9 1.4h14.2A1 1 0 0 0 20 19L15 10V3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IcoBuilding({ color = "white", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth="1.8"
      />
      <path
        d="M8 7h8M8 11h8M8 15h5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IcoDegree({ color = "white", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="5" stroke={color} strokeWidth="1.8" />
      <path
        d="M7 13.5L5 21l7-3 7 3-2-7.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

