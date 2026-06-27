import { useCallback, useState } from "react";
import useChat from "../hooks/useChat";
import useRoadmap from "../hooks/useRoadmap";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
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

const QUICK_REPLIES = [
  "What SHS offers Science?",
  "WASSCE grades for KNUST",
  "Career as a Pharmacist",
  "Best schools for Business",
];

export default function ChatPage() {
  const [careerGoal, setCareerGoal] = useState(null);

  const { stages, updateStage } = useRoadmap();
  const handleRoadmapUpdate = useCallback(
    (update) => {
      updateStage(update);
      if (update?.careerGoal) setCareerGoal(update.careerGoal);
    },
    [updateStage],
  );

  const { messages, isLoading, sendMessage, sessionId, sessionReady } =
    useChat(handleRoadmapUpdate);
  const progress = getProgress(stages);

  const handleQuickReply = (text) => {
    if (sessionId && !isLoading) sendMessage(text);
  };

  const handleNewSession = () => {
    localStorage.removeItem("Caria_session_id");
    window.location.reload();
  };

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ fontFamily: "var(--font-body)", background: "#f8f9fc" }}
    >
      <AppHeader onNewSession={handleNewSession} />

      <div className="flex flex-1 overflow-hidden">
        {/* ════ Chat Panel ════ */}
        <div className="flex flex-col flex-1 bg-white border-r border-border min-w-0">
          {!sessionReady && (
            <div className="px-6 py-2 text-center  bg-gold-faint text-navy border-b border-border">
              Connecting to advisor…
            </div>
          )}
          {sessionReady && !sessionId && (
            <div className="px-6 py-2 text-center  bg-red-50 text-red-700 border-b border-red-100">
              Could not reach server. Please refresh the page.
            </div>
          )}

          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            disabled={!sessionId}
          />

          {/* Quick replies */}
          <div className="flex gap-2 px-6 pb-3 flex-wrap">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                onClick={() => handleQuickReply(q)}
                disabled={!sessionId || isLoading}
                className=" px-4 py-2 rounded-full border border-border text-fg-soft bg-white hover:border-navy hover:text-navy transition-all duration-150 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {q}
              </button>
            ))}
          </div>

          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            disabled={!sessionId}
          />

          <p className="text-center text-[11px] py-2 px-4 shrink-0 text-fg-muted">
            Caria AI can make mistakes. Verify important academic deadlines.
          </p>
        </div>

        {/* ════ Right Info Panel ════ */}
        <aside
          className="w-72 shrink-0 overflow-y-auto border-l border-border p-5 flex flex-col gap-5"
          style={{ background: "#f8f9fc" }}
        >
          {/* Active Context */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-3 text-fg-muted">
              Active Context
            </p>
            <div className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center  font-bold text-white bg-navy shrink-0">
                {careerGoal ? careerGoal.slice(0, 2).toUpperCase() : "?"}
              </div>
              <div>
                <p className=" font-semibold text-navy">
                  {careerGoal || "No goal set yet"}
                </p>
                <p className="text-xs text-fg-muted">Primary Career Goal</p>
              </div>
            </div>
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
                        className={` font-semibold leading-tight ${isLocked ? "text-gray-400" : "text-navy"}`}
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

          {/* Key Documents */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-3 text-fg-muted">
              Key Documents
            </p>
            <div className="flex flex-col gap-2">
              <DocCard
                iconBg="#fee2e2"
                iconColor="#dc2626"
                title="2024 School Register"
                sub="All Category A–D Schools"
                action={<IcoDownload />}
              />
              <DocCard
                iconBg="#dbeafe"
                iconColor="#1d4ed8"
                title="Cut-off Point Matrix"
                sub="Last 3 Years Trends"
                action={<IcoArrow />}
              />
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
            <p className=" font-semibold text-white mb-1">
              {sessionId ? "Ready to help" : "Connecting…"}
            </p>
            <p className="text-[11px] leading-[1.5] text-white/50">
              {sessionId
                ? "Ask about schools, subjects, or career pathways."
                : "Waiting for a connection to the server."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ─── Doc Card ────────────────────────────────────────────── */

function DocCard({ iconBg, iconColor, title, sub, action }) {
  return (
    <div className="bg-white border border-border rounded-xl p-3 flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: iconBg }}
      >
        <IcoDoc color={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className=" font-semibold text-navy truncate">{title}</p>
        <p className="text-[11px] truncate text-fg-muted">{sub}</p>
      </div>
      <button className="text-fg-muted hover:text-navy transition-colors p-1">
        {action}
      </button>
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

function IcoDoc({ color = "#dc2626" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <polyline
        points="14 2 14 8 20 8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <line
        x1="9"
        y1="13"
        x2="15"
        y2="13"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="17"
        x2="13"
        y2="17"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IcoDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IcoArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
