import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ShareResult } from '../domain/signaling/share';

interface InviteLinkBarProps {
  inviteUrl: string;
  onCopyInvite: () => Promise<ShareResult>;
  /** Tighter chrome for the space chat column. */
  dense?: boolean;
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

  const dense = Boolean(props.dense);

  return (
    <div
      data-testid="invite-link-bar"
      data-flash={flash}
      data-bump={bump}
      className={[
        'invite-link-bar flex items-stretch gap-1.5 rounded-lg border transition-colors',
        dense ? 'px-1.5 py-0.5' : 'gap-2 rounded-xl px-2 py-1.5',
        ok
          ? 'invite-link-bar--ok border-[color:var(--color-ok)] bg-[color:var(--color-ok)]/10'
          : fail
            ? 'border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10'
            : dense
              ? 'border-[color:var(--color-line)]/70 bg-[color:var(--color-bg)]/40'
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
        className={[
          'min-w-0 flex-1 truncate border-0 bg-transparent font-mono text-[color:var(--color-ink)] outline-none',
          dense ? 'px-1.5 py-1 text-[10px]' : 'rounded-lg px-2 py-1.5 text-[11px]',
        ].join(' ')}
        style={ok ? { animation: `invite-url-flash 0.9s ease-out` } : undefined}
      />
      <button
        type="button"
        data-testid="share-link"
        onClick={() => void onCopy()}
        className={[
          'inline-flex shrink-0 items-center font-semibold transition',
          dense ? 'gap-1 rounded-md px-2 py-1 text-[11px]' : 'gap-1.5 rounded-lg px-3 py-1.5 text-xs',
          ok
            ? 'bg-[color:var(--color-ok)] text-[color:var(--color-on-gold)]'
            : 'bg-[color:var(--color-gold)] text-[color:var(--color-on-gold)] hover:bg-[color:var(--color-honey)]',
        ].join(' ')}
      >
        {ok ? (
          <>
            <Check
              key={bump}
              className={dense ? 'h-3 w-3' : 'h-3.5 w-3.5'}
              style={{ animation: 'invite-check-pop 0.35s ease-out' }}
              aria-hidden
            />
            Copied
          </>
        ) : fail ? (
          'Select & copy'
        ) : (
          <>
            <Copy className={dense ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden />
            Copy
          </>
        )}
      </button>
    </div>
  );
}
