import ReactMarkdown from 'react-markdown';
import CariaAvatar from './CariaAvatar';

const markdownComponents = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 text-[15px] leading-[1.75]">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-navy">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="my-3 flex flex-col gap-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 flex flex-col gap-2">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2.5 text-[15px] leading-[1.7]">
      <span className="mt-[0.6em] w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
      <span className="min-w-0">{children}</span>
    </li>
  ),
  h2: ({ children }) => (
    <h2
      className="text-lg text-navy mt-5 mb-2 first:mt-0"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[13px] font-semibold uppercase tracking-wider text-fg-muted mt-5 mb-2 first:mt-0">
      {children}
    </h3>
  ),
  blockquote: ({ children }) => (
    <div className="my-3 rounded-xl p-4 bg-gold-faint border border-gold/20">
      {children}
    </div>
  ),
  a: ({ children, href }) => (
    <a href={href} className="text-gold underline underline-offset-2 hover:text-navy">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="text-[13px] bg-cream border border-border rounded px-1.5 py-0.5">
      {children}
    </code>
  ),
};

/**
 * Caria's replies read as a document, not a chat bubble — long-form guidance
 * deserves full measure and typographic hierarchy.
 */
function AgentMessage({ content }) {
  return (
    <div className="flex items-start gap-3.5">
      <CariaAvatar size={34} />
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted mb-2">
          Caria
        </p>
        <div className="text-fg max-w-[62ch]">
          <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function UserMessage({ content }) {
  return (
    <div className="flex justify-end pl-12">
      <div className="rounded-2xl rounded-br-md px-4 py-2.5 bg-navy text-white max-w-[80%]">
        <p className="text-[15px] leading-[1.6] whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

export default function ChatBubble({ role, content }) {
  if (role === 'user') return <UserMessage content={content} />;
  return <AgentMessage content={content} />;
}
