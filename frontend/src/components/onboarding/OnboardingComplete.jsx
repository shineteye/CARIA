import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

/**
 * The end of the wizard.
 *
 * Guests land here with their answers already persisted on the session, so this
 * claims finished work rather than gating entry to it — the numbers at the top
 * are the point. Signed-in students skip the form entirely and go straight to
 * the guide, which the chat page generates.
 */
export default function OnboardingComplete({
  preview,
  sessionId,
  careerGoal,
  onClaimed,
}) {
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
      setError(
        err?.response?.data?.error || "Something went wrong. Please try again.",
      );
      // Nudge an existing account toward logging in instead of re-registering.
      if (err?.response?.status === 409) setMode("login");
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-[520px]">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gold mb-4">
        All done
      </p>

      <h1
        className="text-[30px] sm:text-[38px] leading-[1.2] text-navy mb-6"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Nice work. Let's build your guide.
      </h1>

      {/* What they've already built — the reason to finish the form. */}
      <div className="flex gap-8 py-5 mb-6 border-y border-border">
        <div>
          <p className="text-[28px] font-semibold text-navy tabular-nums leading-none">
            {preview?.answersGiven ?? 12}
          </p>
          <p className="text-[12px] text-fg-muted mt-1.5">answers given</p>
        </div>
        {preview?.topMatch && (
          <div className="min-w-0">
            <p className="text-[28px] font-semibold text-navy tabular-nums leading-none">
              {preview.topMatch.score}%
            </p>
            <p className="text-[12px] text-fg-muted mt-1.5 truncate">
              match · {preview.topMatch.title}
            </p>
          </div>
        )}
      </div>

      <p className="text-[15px] text-fg-soft leading-[1.7] mb-7">
        {isRegister
          ? `Create an account and I'll write your full roadmap: the subjects to take, schools worth choosing, grades to aim for, and university options${
              careerGoal ? ` built around ${careerGoal}` : ""
            }. It stays saved, so you can come back and ask me anything.`
          : "Log in and the answers you just gave will be saved to your account."}
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
            className="w-full px-4 py-3.5 rounded-xl border border-border bg-white text-[15px] text-fg outline-none focus:border-navy transition-colors"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          autoComplete="email"
          required
          className="w-full px-4 py-3.5 rounded-xl border border-border bg-white text-[15px] text-fg outline-none focus:border-navy transition-colors"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={
            isRegister ? "Create a password (6+ characters)" : "Password"
          }
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          className="w-full px-4 py-3.5 rounded-xl border border-border bg-white text-[15px] text-fg outline-none focus:border-navy transition-colors"
        />

        {error && (
          <p className="text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 w-full py-4 rounded-full bg-navy text-white font-semibold text-[16px] hover:bg-navy-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy
            ? "Building your guide…"
            : isRegister
              ? "Build my guide →"
              : "Log in and save →"}
        </button>
      </form>

      <p className="text-[14px] text-fg-muted mt-5 text-center">
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

      <p className="text-[12px] text-fg-muted mt-4 text-center leading-relaxed">
        Your answers are already saved to this session. Signing up just keeps
        them for good.
      </p>
    </div>
  );
}
