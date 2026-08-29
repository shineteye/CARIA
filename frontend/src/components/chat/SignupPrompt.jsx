import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

/**
 * Shown when a guest finishes onboarding. Their answers are already saved on the
 * session — this claims that work for an account rather than gating entry to it,
 * so it leads with what they've built, not with what they can't have.
 */
export default function SignupPrompt({ preview, sessionId, onClaimed }) {
  const { register, login } = useAuth();
  const [mode, setMode] = useState("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const data = isRegister
        ? await register(name.trim(), email.trim(), password, sessionId)
        : await login(email.trim(), password, sessionId);
      onClaimed?.(data.sessionId || sessionId);
    } catch (err) {
      const msg = err?.response?.data?.error || "Something went wrong. Please try again.";
      setError(msg);
      // Nudge an existing account toward logging in instead of re-registering.
      if (err?.response?.status === 409) setMode("login");
      setBusy(false);
    }
  };

  return (
    <div className="shrink-0 border-t border-border bg-white">
      <div className="max-w-[760px] mx-auto px-6 md:px-8 py-6">
        <div className="rounded-2xl border border-gold/30 bg-gold-faint/50 p-6">
          {/* What they've already built */}
          <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold mb-1.5">
                Your guide is ready
              </p>
              <h3
                className="text-xl text-navy leading-snug"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Save it before you lose it
              </h3>
            </div>
            <div className="flex gap-5 text-right">
              <div>
                <p className="text-lg font-semibold text-navy tabular-nums leading-none">
                  {preview?.answersGiven ?? 12}
                </p>
                <p className="text-[11px] text-fg-muted mt-1">answers given</p>
              </div>
              {preview?.topMatch && (
                <div className="max-w-[11rem]">
                  <p className="text-lg font-semibold text-navy tabular-nums leading-none">
                    {preview.topMatch.score}%
                  </p>
                  <p className="text-[11px] text-fg-muted mt-1 truncate">
                    {preview.topMatch.title}
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-[14px] text-fg-soft leading-[1.65] mb-5">
            {isRegister
              ? "Create an account and Caria will write your full roadmap — subjects, schools, grades and university options built around everything you just told me. It stays saved, so you can come back and ask follow-ups anytime."
              : "Log in and your answers from just now will be saved to your account."}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            {isRegister && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-[15px] text-fg outline-none focus:border-navy transition-colors"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-[15px] text-fg outline-none focus:border-navy transition-colors"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? "Create a password (6+ characters)" : "Password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-[15px] text-fg outline-none focus:border-navy transition-colors"
            />

            {error && (
              <p className="text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 w-full py-3.5 rounded-full bg-navy text-white font-semibold text-[15px] hover:bg-navy-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy
                ? "Building your guide…"
                : isRegister
                  ? "Save my guide →"
                  : "Log in and save →"}
            </button>
          </form>

          <p className="text-[13px] text-fg-muted mt-4 text-center">
            {isRegister ? "Already have an account?" : "New to Caria?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(isRegister ? "login" : "register");
                setError(null);
              }}
              className="font-semibold text-navy hover:text-gold transition-colors"
            >
              {isRegister ? "Log in" : "Create one"}
            </button>
          </p>

          <p className="text-[11px] text-fg-muted mt-3 text-center leading-relaxed">
            Your answers are already saved to this session — signing up just keeps
            them for good.
          </p>
        </div>
      </div>
    </div>
  );
}
