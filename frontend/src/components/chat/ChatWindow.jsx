import { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';
import CariaAvatar from './CariaAvatar';

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3.5">
      <CariaAvatar size={34} />
      <div
        className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl bg-cream border border-border"
        aria-label="Caria is working on it"
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

/**
 * The consultation thread. Plans appear here only as references (onOpenPlan);
 * `intro` renders above the thread when there is no real exchange yet.
 */
export default function ChatWindow({ messages, isLoading, onOpenPlan, intro }) {
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
        <div className="max-w-[760px] mx-auto px-4 sm:px-6 md:px-8 py-8 flex flex-col gap-7 min-h-full">
          {intro}

          {messages.map((msg, index) => (
            <ChatBubble
              key={`${msg.timestamp}-${index}`}
              role={msg.role}
              content={msg.content}
              kind={msg.kind}
              timestamp={msg.timestamp}
              onOpenPlan={onOpenPlan}
            />
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>
    </>
  );
}
