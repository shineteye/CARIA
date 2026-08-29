import { useCallback, useState } from "react";
import useChat from "../hooks/useChat";
import useRoadmap from "../hooks/useRoadmap";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import QuestionCard from "../components/chat/QuestionCard";
import ContextPanel from "../components/chat/ContextPanel";
import ProfileEditor from "../components/chat/ProfileEditor";
import SignupPrompt from "../components/chat/SignupPrompt";
import AppHeader from "../components/layout/AppHeader";

const ROADMAP_META = [
  { key: "JHS", label: "BECE Preparation" },
  { key: "BECE", label: "SHS Selection (CSSPS)" },
  { key: "SHS", label: "WASSCE / Pre-University" },
  { key: "WASSCE", label: "University Admission" },
  { key: "University", label: "Professional Degree" },
];

const CHAT_QUICK_REPLIES = [
  "Refine my roadmap for my grades",
  "What SHS stream fits me?",
  "How do I talk to my parents about this?",
  "Options if I miss top cutoffs",
];

export default function ChatPage() {
  const [sidebarGoal, setSidebarGoal] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

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
    signupPreview,
    unlockGuide,
    setProfileLocal,
  } = useChat(handleMetaUpdate);

  const displayGoal = sidebarGoal || careerGoal;
  const isOnboarding = phase === "onboarding";
  const awaitingSignup = phase === "awaiting_signup";
  const currentQuestion = onboarding?.question || null;
  const inputDisabled = !sessionId || isLoading;

  const handleQuickReply = (text) => {
    if (sessionId && !isLoading) sendMessage(text);
  };

  const handleNewSession = () => {
    localStorage.removeItem("Caria_session_id");
    window.location.reload();
  };

  const panelProps = {
    phase,
    onboarding,
    profile,
    careerGoal: displayGoal,
    guideReady,
    stages,
    roadmapMeta: ROADMAP_META,
    onEditProfile: () => {
      setEditorOpen(true);
      setPanelOpen(false);
    },
  };

  return (
    <div
      className="flex flex-col h-screen overflow-hidden bg-white"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <AppHeader
        onNewSession={handleNewSession}
        onAvatarClick={() => setEditorOpen(true)}
        variant="cream"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ════ Conversation ════ */}
        <div className="flex flex-col flex-1 min-w-0">
          {!sessionReady && (
            <div className="px-6 py-2 text-center text-[13px] bg-gold-faint text-navy border-b border-gold/20 shrink-0">
              Connecting to Caria…
            </div>
          )}
          {sessionReady && !sessionId && (
            <div className="px-6 py-2 text-center text-[13px] bg-red-50 text-red-700 border-b border-red-100 shrink-0">
              Could not reach the server. Please refresh the page.
            </div>
          )}

          <ChatWindow messages={messages} isLoading={isLoading} phase={phase} />

          {/* Guest finished onboarding — claim the work with an account. */}
          {awaitingSignup ? (
            <SignupPrompt
              preview={signupPreview}
              sessionId={sessionId}
              onClaimed={unlockGuide}
            />
          ) : (
            <>
              {/* Onboarding: pinned question + chips. Free chat: quick replies. */}
              {isOnboarding ? (
                <QuestionCard
                  question={currentQuestion}
                  disabled={inputDisabled}
                  onSelect={handleQuickReply}
                />
              ) : (
                messages.length > 0 && (
                  <div className="shrink-0 border-t border-border bg-white">
                    <div className="max-w-[760px] mx-auto px-6 md:px-8 pt-4 pb-1 flex gap-2 overflow-x-auto">
                      {CHAT_QUICK_REPLIES.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleQuickReply(q)}
                          disabled={inputDisabled}
                          className="shrink-0 px-3.5 py-2 rounded-full border border-border text-[13px] text-fg-soft bg-white hover:border-navy hover:text-navy transition-all duration-150 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}

              <ChatInput
                onSend={sendMessage}
                isLoading={isLoading}
                disabled={!sessionId}
                placeholder={
                  isOnboarding
                    ? currentQuestion?.placeholder || "Or type your own answer…"
                    : "Ask a follow-up…"
                }
                hint={
                  isOnboarding
                    ? "Tap an option above, or type something more specific."
                    : "Caria can make mistakes — verify important dates and cutoffs."
                }
              />
            </>
          )}
        </div>

        {/* ════ Context panel — desktop ════ */}
        <aside className="hidden lg:block w-[300px] shrink-0 overflow-y-auto border-l border-border bg-cream">
          <ContextPanel {...panelProps} />
        </aside>
      </div>

      {/* ════ Context panel — mobile toggle + drawer ════ */}
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        className="lg:hidden fixed bottom-24 right-5 z-30 w-12 h-12 rounded-full bg-navy text-white shadow-lg flex items-center justify-center"
        aria-label="Show your progress and profile"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 6h16M4 12h16M4 18h10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {panelOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-navy/40 backdrop-blur-[2px] z-40"
            onClick={() => setPanelOpen(false)}
          />
          <aside className="lg:hidden fixed top-0 right-0 h-full w-[85%] max-w-[340px] bg-cream z-50 shadow-2xl overflow-y-auto border-l border-border">
            <div className="flex justify-end p-4 pb-0">
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Close panel"
                className="text-fg-muted hover:text-navy p-1"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <ContextPanel {...panelProps} />
          </aside>
        </>
      )}

      <ProfileEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialProfile={profile}
        onSaved={(data) => setProfileLocal(data.profile, data.careerGoal)}
      />
    </div>
  );
}
