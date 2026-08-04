import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpg";

export default function AuthPage() {
  const { isAuthenticated, loading, login, register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = location.state?.from || "/chat";

  const [mode, setMode] = useState(
    location.pathname === "/register" ? "register" : "login",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const isRegister = mode === "register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex bg-cream"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Left brand panel */}
      <aside className="hidden lg:flex w-[46%] relative overflow-hidden bg-navy text-white flex-col justify-between p-12">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, #243e7a 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(201,151,10,0.25) 0%, transparent 45%)",
          }}
        />
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <img
              src={logo}
              alt="Caria"
              className="h-11 w-11 rounded-full object-contain bg-white"
            />
            <span className="text-lg font-semibold tracking-tight">
              Caria <span className="text-gold-light">AI</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-xs uppercase tracking-[0.18em] text-gold-light mb-4">
            Your academic companion
          </p>
          <h1
            className="text-4xl leading-[1.15] mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Build a path that fits{" "}
            <em className="not-italic text-gold-light">who you are</em>
          </h1>
          <p className="text-white/65 leading-relaxed text-base">
            Create a free account to save your student profile, edit your
            answers anytime, and pick up your personal guide where you left off.
          </p>

          <ul className="mt-10 space-y-3">
            {[
              "Chat-style onboarding with tap-to-answer",
              "Personal roadmap from JHS to university",
              "Edit your profile as life changes",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/80">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/40">
          Built for Ghanaian students · Free to use
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-md mx-auto">
          <Link
            to="/"
            className="lg:hidden inline-flex items-center gap-2.5 mb-10"
          >
            <img
              src={logo}
              alt="Caria"
              className="h-9 w-9 rounded-full object-contain bg-white border border-border"
            />
            <span className="font-semibold text-navy">
              Caria <span className="text-gold">AI</span>
            </span>
          </Link>

          <p className="text-xs uppercase tracking-[0.16em] text-gold mb-3 font-semibold">
            {isRegister ? "Create account" : "Welcome back"}
          </p>
          <h2
            className="text-3xl text-fg mb-2 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isRegister ? "Start your profile" : "Log in to continue"}
          </h2>
          <p className="text-fg-soft text-[15px] mb-8 leading-relaxed">
            {isRegister
              ? "You’ll need an account before we build your personal guide."
              : "Your profile and chat history are waiting."}
          </p>

          {/* Mode tabs */}
          <div className="flex p-1 rounded-full bg-white border border-border mb-8">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                !isRegister
                  ? "bg-navy text-white shadow-sm"
                  : "text-fg-soft hover:text-navy"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                isRegister
                  ? "bg-navy text-white shadow-sm"
                  : "text-fg-soft hover:text-navy"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <Field
                label="Full name"
                id="name"
                value={name}
                onChange={setName}
                placeholder="e.g. Ama Mensah"
                autoComplete="name"
                required
              />
            )}
            <Field
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={isRegister ? "At least 6 characters" : "Your password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              minLength={6}
            />

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3.5 rounded-full bg-navy text-white font-semibold text-[15px] hover:bg-navy-light transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
            >
              {submitting
                ? isRegister
                  ? "Creating account…"
                  : "Logging in…"
                : isRegister
                  ? "Create account & start"
                  : "Log in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-fg-muted">
            <Link to="/" className="hover:text-navy transition-colors">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  required,
  minLength,
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold uppercase tracking-wide text-fg-muted mb-1.5">
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[15px] text-fg outline-none transition-colors focus:border-navy placeholder:text-fg-muted/70"
      />
    </label>
  );
}
