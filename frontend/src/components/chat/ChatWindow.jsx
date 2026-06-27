import { useEffect, useRef } from 'react';
import { RiRobotLine } from 'react-icons/ri';
import ChatBubble from './ChatBubble';

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white bg-navy">
        <RiRobotLine size={18} />
      </div>
      <div
        className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100"
        aria-label="Advisor is typing"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-fg-muted"
            style={{ animation: `typingDot 1.2s ${i * 0.2}s ease-in-out infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-8 py-16 gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white bg-navy">
        <RiRobotLine size={30} />
      </div>
      <div>
        <p className="text-lg font-semibold text-navy mb-1">
          Your AI Academic Advisor
        </p>
        <p className="text-base leading-[1.6] text-fg-muted">
          Tell me your career goal and I'll map your complete<br />path from JHS to university.
        </p>
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <>
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {messages.length === 0 && !isLoading && <EmptyState />}

        {messages.map((msg, index) => (
          <ChatBubble
            key={`${msg.timestamp}-${index}`}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}

        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </>
  );
}
