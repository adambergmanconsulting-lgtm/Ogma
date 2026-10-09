import { useState, type FormEvent } from 'react';
import { Send, X } from 'lucide-react';
import type { ChatMessage } from '../domain/types';

interface ChatDrawerProps {
  open: boolean;
  messages: ChatMessage[];
  selfId: string;
  onClose: () => void;
  onSend: (text: string) => void;
}

export function ChatDrawer({ open, messages, selfId, onClose, onSend }: ChatDrawerProps) {
  const [draft, setDraft] = useState('');

  if (!open) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <aside className="flex w-full max-w-md flex-col border-l border-[color:var(--color-line)] bg-[color:var(--color-panel)]/95 backdrop-blur md:w-80">
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="font-[family-name:var(--font-display)] text-base">Chat</h2>
        <button
          type="button"
          aria-label="Close chat"
          onClick={onClose}
          className="rounded-lg p-2 text-[color:var(--color-muted)] hover:bg-[color:var(--color-panel-2)]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-2">
        {messages.map((m) => {
          const mine = m.peerId === selfId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={[
                  'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                  mine
                    ? 'bg-[color:var(--color-gold)] text-[color:var(--color-on-gold)]'
                    : 'bg-[color:var(--color-panel-2)] ring-1 ring-[color:var(--color-line)]',
                ].join(' ')}
              >
                {!mine ? (
                  <div className="mb-0.5 text-[11px] font-semibold opacity-80">{m.displayName}</div>
                ) : null}
                <div>{m.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-[color:var(--color-line)] p-3">
        <input
          data-testid="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Message"
          className="min-w-0 flex-1 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
        />
        <button
          type="submit"
          data-testid="chat-send"
          aria-label="Send"
          className="rounded-xl bg-[color:var(--color-gold)] px-3 text-[color:var(--color-on-gold)] hover:bg-[color:var(--color-honey)]"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}
