/**
 * Caria's identity mark — a serif monogram rather than a generic robot icon,
 * so the advisor reads as a named guide, not a chatbot.
 */
export default function CariaAvatar({ size = 36 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 bg-navy text-gold-light select-none"
      style={{
        width: size,
        height: size,
        fontFamily: "var(--font-display)",
        fontSize: size * 0.5,
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      C
    </div>
  );
}
