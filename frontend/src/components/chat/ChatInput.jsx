import { useState, useRef } from 'react';

function SendIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 0.6s linear infinite' }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function ChatInput({
  onSend,
  isLoading,
  disabled = false,
  placeholder,
  hint,
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const canSend = !!text.trim() && !isLoading && !disabled;
  const resolvedPlaceholder =
    placeholder || 'Ask about schools, courses, or requirements…';

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  return (
    <div className="shrink-0 bg-white border-t border-border">
      <div className="max-w-[760px] mx-auto px-6 md:px-8 py-4">
        <div
          className={`flex items-end gap-2 rounded-[22px] border bg-cream/60 pl-4 pr-2 py-2 transition-colors ${
            text ? 'border-navy bg-white' : 'border-border'
          }`}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isLoading || disabled}
            placeholder={resolvedPlaceholder}
            rows={1}
            className="flex-1 resize-none outline-none text-[15px] text-fg placeholder:text-fg-muted bg-transparent leading-[1.6] py-2 disabled:cursor-not-allowed"
            style={{ minHeight: 24, maxHeight: 140, fontFamily: 'var(--font-body)' }}
          />

          <button
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all duration-150 ${
              canSend
                ? 'bg-navy text-white hover:bg-navy-light'
                : 'bg-border/70 text-fg-muted cursor-not-allowed'
            }`}
          >
            {isLoading ? <SpinnerIcon /> : <SendIcon />}
          </button>
        </div>

        {hint && (
          <p className="text-[11px] text-fg-muted mt-2.5 text-center">{hint}</p>
        )}
      </div>
    </div>
  );
}
