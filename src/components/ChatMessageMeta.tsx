import { formatMessageTime } from '../domain/formatMessageTime';
import { PersonName } from './PersonName';

interface ChatMessageMetaProps {
  at: number;
  align: 'start' | 'end';
  /** Display name for every line — needed in 3+ person chats. */
  author: string;
  selfName?: string;
  personId?: string | null;
  /** Quiet marker when the body was folded from an edit. */
  edited?: boolean;
}

/** Muted author + time row above a chat line. */
export function ChatMessageMeta({
  at,
  align,
  author,
  selfName,
  personId,
  edited,
}: ChatMessageMetaProps) {
  const label = formatMessageTime(at);
  if (!label && !author && !edited) return null;

  return (
    <div
      className={[
        'mb-0.5 flex items-baseline gap-1.5 text-[11px] text-[color:var(--color-muted)]',
        align === 'end' ? 'justify-end' : 'justify-start',
      ].join(' ')}
    >
      {author ? (
        <PersonName name={author} selfName={selfName} personId={personId} />
      ) : null}
      {label ? (
        <time dateTime={new Date(at).toISOString()} className="tabular-nums">
          {label}
        </time>
      ) : null}
      {edited ? (
        <span data-testid="message-edited" className="italic">
          edited
        </span>
      ) : null}
    </div>
  );
}
