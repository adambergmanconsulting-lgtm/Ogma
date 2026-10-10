import { useState, type FormEvent } from 'react';
import { Send, X } from 'lucide-react';
import type { ChatMessage } from '../domain/types';
import { ChatMessageText } from './ChatMessageText';

interface ChatDrawerProps {
  open: boolean;
  messages: ChatMessage[];
  selfId: string;
  hasMoreOlder?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
  onClose: () => void;
  onSend: (text: string) => void;
}

export function ChatDrawer({
  open,
  messages,
  selfId,
  hasMoreOlder,
  loadingOlder,
  onLoadOlder,
  onClose,
  onSend,
}: ChatDrawerProps) {
  const [draft, setDraft] = useState('');

  if (!open) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <aside className="drawer-sheet">
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-sm font-semibold">Chat</h2>
        <button
          type="button"
          aria-label="Close chat"
          onClick={onClose}
          className="rounded-lg p-2 text-[color:var(--color-muted)] hover:bg-[color:var(--color-panel-2)]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto px-3 py-2">
        {hasMoreOlder ? (
          <div className="flex justify-center py-1">
            <button
              type="button"
              data-testid="load-older"
              disabled={loadingOlder}
              onClick={() => onLoadOlder?.()}
              className="btn-quiet"
            >
              {loadingOlder ? 'Loading…' : 'Load older'}
            </button>
          </div>
        ) : null}
        {messages.length === 0 ? (
          <p className="text-muted pt-6 text-center">No messages yet</p>
        ) : (
          messages.map((m) => {
            const mine = m.peerId === selfId;
            return (
              <div
                key={m.id}
                className={`max-w-[90%] text-sm ${mine ? 'ml-auto text-right' : ''}`}
              >
                {!mine ? (
                  <div className="mb-0.5 text-[11px] text-[color:var(--color-muted)]">
                    {m.displayName}
                  </div>
                ) : null}
                <ChatMessageText text={m.text} />
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-[color:var(--color-line)] p-3">
        <input
          data-testid="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Message"
          className="field field--inset flex-1 text-sm"
        />
        <button
          type="submit"
          data-testid="chat-send"
          aria-label="Send"
          className="btn-primary px-3"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}
