import { useEffect, useRef, useState } from 'react';
import type { ShareResult } from '../domain/signaling/share';
import { ChatMessageText } from './ChatMessageText';
import { InviteLinkBar } from './InviteLinkBar';

export type SpaceMessageView = {
  id: string;
  author: string;
  text: string;
  ts: number;
  self: boolean;
};

interface SpaceViewProps {
  title: string;
  inviteUrl: string | null;
  messages: SpaceMessageView[];
  error: string | null;
  hasMoreOlder?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
  onSend: (text: string) => void;
  onCopyInvite: () => Promise<ShareResult>;
}

export function SpaceView(props: SpaceViewProps) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    const lastId = props.messages[props.messages.length - 1]?.id ?? null;
    // Scroll on new tail messages only — not when prepending Load older.
    if (lastId && lastId !== lastMessageIdRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    lastMessageIdRef.current = lastId;
  }, [props.messages]);

  return (
    <div className="app-column app-gutter-x flex h-full min-h-0 flex-col py-5">
      <header className="mb-4 space-y-2">
        <h1 className="truncate text-xl font-semibold tracking-tight">{props.title}</h1>
        {props.inviteUrl ? (
          <InviteLinkBar inviteUrl={props.inviteUrl} onCopyInvite={props.onCopyInvite} />
        ) : null}
      </header>

      {props.error ? (
        <p className="mb-2 text-sm text-[color:var(--color-danger)]">{props.error}</p>
      ) : null}

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto py-1">
        {props.hasMoreOlder ? (
          <div className="flex justify-center py-1">
            <button
              type="button"
              data-testid="load-older"
              disabled={props.loadingOlder}
              onClick={() => props.onLoadOlder?.()}
              className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] disabled:opacity-60"
            >
              {props.loadingOlder ? 'Loading…' : 'Load older'}
            </button>
          </div>
        ) : null}
        {props.messages.length === 0 ? (
          <p className="pt-8 text-center text-sm text-[color:var(--color-muted)]">
            Call when you&apos;re ready
          </p>
        ) : (
          props.messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[90%] text-sm ${m.self ? 'ml-auto text-right' : ''}`}
            >
              {!m.self ? (
                <div className="mb-0.5 text-xs text-[color:var(--color-muted)]">{m.author}</div>
              ) : null}
              <ChatMessageText text={m.text} />
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="mt-3 flex gap-2 border-t border-[color:var(--color-line)]/50 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (!text) return;
          props.onSend(text);
          setDraft('');
        }}
      >
        <input
          data-testid="space-compose"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)]/80 px-3 py-2.5 outline-none focus:border-[color:var(--color-gold)]"
          aria-label="Message"
        />
        <button
          type="submit"
          data-testid="space-send"
          disabled={!draft.trim()}
          className="rounded-xl bg-[color:var(--color-gold)] px-4 py-2.5 font-semibold text-[color:var(--color-on-gold)] disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
