import { splitMessageLinks } from '../domain/thread/messageLinks';

interface ChatMessageTextProps {
  text: string;
}

export function ChatMessageText({ text }: ChatMessageTextProps) {
  const origin = typeof globalThis.location !== 'undefined' ? globalThis.location.origin : undefined;
  const parts = splitMessageLinks(text, origin);

  return (
    <div className="whitespace-pre-wrap break-words text-left">
      {parts.map((part, i) => {
        if (part.kind === 'text') {
          return <span key={i}>{part.text}</span>;
        }
        return (
          <a
            key={i}
            href={part.href}
            title={part.title}
            target={part.external ? '_blank' : undefined}
            rel={part.external ? 'noopener noreferrer' : undefined}
            className="break-all text-[color:var(--color-gold)] underline decoration-[color:var(--color-gold)]/50 underline-offset-2 hover:decoration-[color:var(--color-honey)]"
          >
            {part.label}
          </a>
        );
      })}
    </div>
  );
}
