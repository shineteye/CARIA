import { useState, useRef } from 'react';

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.6s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function ChatInput({ onSend, isLoading, disabled = false }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const canSend = !!text.trim() && !isLoading && !disabled;

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
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="flex items-end gap-3 px-6 pb-3 shrink-0">
        <div
          className={`flex-1 flex items-end gap-3 rounded-2xl border px-4 py-3 bg-white transition-colors ${
            text ? 'border-navy' : 'border-border'
          }`}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isLoading || disabled}
            placeholder="Ask about schools, courses, or requirements..."
            rows={1}
            className="flex-1 resize-none outline-none text-[15px] text-fg placeholder:text-fg-muted bg-transparent leading-normal"
            style={{ minHeight: 24, maxHeight: 120, fontFamily: 'var(--font-body)' }}
          />
          <button
            type="button"
            className="shrink-0 text-fg-muted hover:text-navy transition-colors pb-0.5"
            aria-label="Voice input"
          >
            <MicIcon />
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${
            canSend ? 'bg-navy cursor-pointer' : 'bg-gray-200 cursor-not-allowed'
          }`}
        >
          {isLoading ? <SpinnerIcon /> : <SendIcon />}
        </button>
      </div>
    </>
  );
}
