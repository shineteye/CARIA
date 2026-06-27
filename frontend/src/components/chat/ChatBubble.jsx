import ReactMarkdown from 'react-markdown';
import { RiRobotLine } from 'react-icons/ri';

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function AdvisorAvatar() {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white bg-navy"
      aria-hidden="true"
    >
      <RiRobotLine size={18} />
    </div>
  );
}

function UserAvatar() {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-border"
      aria-hidden="true"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="#6b7280" strokeWidth="1.8"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

const markdownComponents = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 text-[15px] leading-[1.7]">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-navy">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="my-2 flex flex-col gap-2 pl-1">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-[15px] leading-[1.65]">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <div className="my-3 rounded-xl p-4 border bg-gray-50 border-border">
      {children}
    </div>
  ),
};

function AgentBubble({ content, timestamp }) {
  return (
    <div className="flex items-start gap-3">
      <AdvisorAvatar />
      <div className="flex flex-col gap-1 max-w-[78%]">
        <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-gray-100">
          <div className="text-fg">
            <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
          </div>
        </div>
        {timestamp && (
          <span className="text-[11px] pl-1 text-fg-muted">
            Advisor • {formatTime(timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

function UserBubble({ content, timestamp }) {
  return (
    <div className="flex items-start gap-3 flex-row-reverse">
      <UserAvatar />
      <div className="flex flex-col gap-1 items-end max-w-[78%]">
        <div className="rounded-2xl rounded-tr-sm px-4 py-3 bg-navy text-white">
          <p className="text-[15px] leading-[1.65]">{content}</p>
        </div>
        {timestamp && (
          <span className="text-[11px] pr-1 text-fg-muted">
            You • {formatTime(timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ChatBubble({ role, content, timestamp }) {
  if (role === 'user') return <UserBubble content={content} timestamp={timestamp} />;
  return <AgentBubble content={content} timestamp={timestamp} />;
}
