import { Children, isValidElement } from 'react';
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
          Caria · Advisor
        </p>
        <div className="text-fg max-w-[62ch]">
          <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

/** The pathway is the one ordered list in a guide; its steps carry numbers. */
function GuideSteps({ children }) {
  const steps = Children.toArray(children).filter(isValidElement);
  return (
    <ol className="my-3 flex flex-col">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3.5">
          <div className="flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-navy text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            {i < steps.length - 1 && <span className="w-px flex-1 bg-border my-1" />}
          </div>
          <div className="min-w-0 pb-4 text-[15px] leading-[1.7]">
            {step.props.children}
          </div>
        </li>
      ))}
    </ol>
  );
}

const guideComponents = {
  ...markdownComponents,
  h3: ({ children }) => (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold mt-7 mb-2.5 pt-5 border-t border-border first:mt-0 first:pt-0 first:border-t-0">
      {children}
    </h3>
  ),
  ol: GuideSteps,
};

/**
 * The personal guidance plan: a document the student keeps coming back to, so
 * it is set apart from the conversation rather than rendered as one more reply.
 */
export function GuideDocument({ content, timestamp, headerAction }) {
  return (
    <article className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <header className="px-6 md:px-8 py-5 bg-navy text-white flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-light mb-1">
            Personal guidance plan{timestamp ? ` · ${formatDate(timestamp)}` : ''}
          </p>
          <h2 className="text-xl leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
            Your path from here
          </h2>
        </div>
        {headerAction}
      </header>
      <div className="px-6 md:px-8 py-6 text-fg">
        <ReactMarkdown components={guideComponents}>{content}</ReactMarkdown>
      </div>
      <footer className="px-6 md:px-8 py-3.5 bg-cream border-t border-border text-[12px] text-fg-muted">
        Built from your onboarding answers. Cut-offs shown are published figures; confirm them with the university before applying.
      </footer>
    </article>
  );
}

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Inside the conversation a plan is a reference, not a wall of text — the full
 * document lives in the Plan view.
 */
function PlanReference({ content, timestamp, onOpen }) {
  const direction = /### Recommended direction\s*\n\*\*(.+?)\*\*/.exec(content || '')?.[1];
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-cream/60 px-5 py-4">
      <span className="w-10 h-10 rounded-xl bg-navy text-gold-light flex items-center justify-center shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 3h9l3 3v15H6z M9 10h6M9 14h6M9 18h4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
          Guidance plan{timestamp ? ` · ${formatDate(timestamp)}` : ''}
        </p>
        <p className="text-[14px] text-navy font-medium truncate">
          {direction ? `Recommended: ${direction}` : 'Your plan was updated'}
        </p>
      </div>
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="shrink-0 text-[13px] font-semibold text-navy hover:text-gold transition-colors"
        >
          Open plan →
        </button>
      )}
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

export default function ChatBubble({ role, content, kind, timestamp, onOpenPlan }) {
  if (role === 'user') return <UserMessage content={content} />;
  if (kind === 'guide') {
    return onOpenPlan ? (
      <PlanReference content={content} timestamp={timestamp} onOpen={onOpenPlan} />
    ) : (
      <GuideDocument content={content} timestamp={timestamp} />
    );
  }
  return <AgentMessage content={content} />;
}
