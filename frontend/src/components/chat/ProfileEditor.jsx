import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../../services/api";

export default function ProfileEditor({ open, onClose, onSaved, initialProfile }) {
  const [fields, setFields] = useState([]);
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const data = await getProfile();
        if (cancelled) return;
        setFields(data.fields || []);
        setDraft(normalizeDraft(data.profile || initialProfile || {}));
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.error || "Could not load profile fields.",
          );
          setDraft(normalizeDraft(initialProfile || {}));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, initialProfile]);

  if (!open) return null;

  const setField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMulti = (key, label) => {
    setDraft((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      const next = current.includes(label)
        ? current.filter((x) => x !== label)
        : [...current, label];
      return { ...prev, [key]: next };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const data = await updateProfile(draft);
      setSuccess(data.message || "Saved.");
      onSaved?.(data);
      setTimeout(() => onClose?.(), 700);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-navy/40 backdrop-blur-[2px] z-50"
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 h-full w-full max-w-lg bg-cream z-50 shadow-2xl flex flex-col border-l border-border"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <header className="px-6 py-5 border-b border-border bg-white flex items-start justify-between gap-4 shrink-0">
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-gold mb-1">
              Your answers
            </p>
            <h2
              className="text-2xl text-navy leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Edit profile
            </h2>
            <p className="text-sm text-fg-soft mt-1">
              Change anything — future advice will use the updated answers.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-border bg-white text-fg-muted hover:text-navy hover:border-navy transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading && (
            <p className="text-sm text-fg-muted text-center py-12">
              Loading your answers…
            </p>
          )}

          {!loading &&
            fields.map((field) => (
              <div
                key={field.profileKey}
                className="bg-white border border-border rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-navy">
                    {field.label}
                  </h3>
                  {field.multi && (
                    <span className="text-[10px] uppercase tracking-wide text-fg-muted font-semibold">
                      Multi-select
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {field.options.map((opt) => {
                    const active = field.multi
                      ? (draft[field.profileKey] || []).includes(opt.label)
                      : draft[field.profileKey] === opt.label;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          field.multi
                            ? toggleMulti(field.profileKey, opt.label)
                            : setField(field.profileKey, opt.label)
                        }
                        className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                          active
                            ? "bg-navy text-white border-navy"
                            : "bg-cream text-fg-soft border-border hover:border-navy hover:text-navy"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={
                    field.multi
                      ? (draft[field.profileKey] || []).join(", ")
                      : draft[field.profileKey] || ""
                  }
                  onChange={(e) => {
                    if (field.multi) {
                      setField(
                        field.profileKey,
                        e.target.value
                          .split(/[,;|]/)
                          .map((s) => s.trim())
                          .filter(Boolean),
                      );
                    } else {
                      setField(field.profileKey, e.target.value);
                    }
                  }}
                  placeholder="Or type a custom answer…"
                  className="w-full rounded-xl border border-border bg-cream/50 px-3 py-2.5 text-[13px] text-fg outline-none focus:border-navy focus:bg-white transition-colors"
                />
              </div>
            ))}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </div>
          )}
        </div>

        <footer className="px-6 py-4 border-t border-border bg-white flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-full border border-border text-fg-soft font-semibold text-sm hover:border-navy hover:text-navy transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 py-3 rounded-full bg-navy text-white font-semibold text-sm hover:bg-navy-light transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </footer>
      </aside>
    </>
  );
}

function normalizeDraft(profile) {
  return {
    educationLevel: profile.educationLevel || "",
    region: profile.region || "",
    strengths: profile.strengths || [],
    challenges: profile.challenges || [],
    interests: profile.interests || [],
    careerDirection: profile.careerDirection || "",
    influences: profile.influences || "",
    familyExpectations: profile.familyExpectations || "",
    financialSituation: profile.financialSituation || "",
    mobility: profile.mobility || "",
    timeline: profile.timeline || "",
    motivation: profile.motivation || "",
  };
}
