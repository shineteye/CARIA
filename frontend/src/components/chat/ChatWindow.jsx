import { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';
import CariaAvatar from './CariaAvatar';

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3.5">
      <CariaAvatar size={34} />
      <div
        className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl bg-cream border border-border"
        aria-label="Caria is thinking"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-navy/40"
            style={{ animation: `typingDot 1.2s ${i * 0.15}s ease-in-out infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ phase }) {
  const onboarding = phase === 'onboarding';
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-8 py-16 gap-5">
      <CariaAvatar size={64} />
      <div className="max-w-[38ch]">
        <h2
          className="text-2xl text-navy mb-3 leading-snug"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {onboarding
            ? "First, tell me about you"
            : 'Ask me anything about your path'}
        </h2>
        <p className="text-[15px] leading-[1.7] text-fg-soft">
          {onboarding
            ? "A few questions about your school stage, strengths, family, and what you can afford — then I'll build your guide."
            : 'Streams, cutoffs, backup options, or how to talk to your parents. Your profile is already understood.'}
        </p>
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, isLoading, phase = 'chat' }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <>
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[760px] mx-auto px-6 md:px-8 py-8 flex flex-col gap-7 min-h-full">
          {messages.length === 0 && !isLoading && <EmptyState phase={phase} />}

          {messages.map((msg, index) => (
            <ChatBubble
              key={`${msg.timestamp}-${index}`}
              role={msg.role}
              content={msg.content}
            />
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>
    </>
  );
}
