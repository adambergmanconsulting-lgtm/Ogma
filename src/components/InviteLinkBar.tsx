import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ShareResult } from '../domain/signaling/share';

interface InviteLinkBarProps {
  inviteUrl: string;
  onCopyInvite: () => Promise<ShareResult>;
}

type Flash = 'idle' | 'ok' | 'fail';

export function InviteLinkBar(props: InviteLinkBarProps) {
  const [flash, setFlash] = useState<Flash>('idle');
  const [bump, setBump] = useState(0);
  const clearTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (clearTimer.current) window.clearTimeout(clearTimer.current);
    };
  }, []);

  const scheduleClear = () => {
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    clearTimer.current = window.setTimeout(() => setFlash('idle'), 2200);
  };

  const onCopy = async () => {
    const result = await props.onCopyInvite();
    if (result.ok) {
      setFlash('ok');
      setBump((n) => n + 1);
      inputRef.current?.select();
      scheduleClear();
      return;
    }
    if (result.reason === 'cancelled') {
      setFlash('idle');
      return;
    }
    setFlash('fail');
    inputRef.current?.select();
    scheduleClear();
  };

  const ok = flash === 'ok';
  const fail = flash === 'fail';

  return (
    <div
      data-testid="invite-link-bar"
      data-flash={flash}
      data-bump={bump}
      className={[
        'invite-link-bar flex items-stretch gap-2 rounded-xl border px-2 py-1.5 transition-colors',
        ok
          ? 'invite-link-bar--ok border-[color:var(--color-ok)] bg-[color:var(--color-ok)]/10'
          : fail
            ? 'border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10'
            : 'border-[color:var(--color-line)] bg-[color:var(--color-panel-2)]/60',
      ].join(' ')}
      style={ok ? { animation: `invite-bar-pulse 0.7s ease-out` } : undefined}
    >
      <input
        ref={inputRef}
        data-testid="invite-url"
        readOnly
        value={props.inviteUrl}
        aria-label="Invite link"
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 truncate rounded-lg border-0 bg-transparent px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-ink)] outline-none"
        style={ok ? { animation: `invite-url-flash 0.9s ease-out` } : undefined}
      />
      <button
        type="button"
        data-testid="share-link"
        onClick={() => void onCopy()}
        className={[
          'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
          ok
            ? 'bg-[color:var(--color-ok)] text-[color:var(--color-on-gold)]'
            : 'bg-[color:var(--color-gold)] text-[color:var(--color-on-gold)] hover:bg-[color:var(--color-honey)]',
        ].join(' ')}
      >
        {ok ? (
          <>
            <Check
              key={bump}
              className="h-3.5 w-3.5"
              style={{ animation: 'invite-check-pop 0.35s ease-out' }}
              aria-hidden
            />
            Copied
          </>
        ) : fail ? (
          'Select & copy'
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" aria-hidden />
            Copy
          </>
        )}
      </button>
    </div>
  );
}
