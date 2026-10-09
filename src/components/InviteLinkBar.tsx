import { Check, Copy, Link2 } from 'lucide-react';
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
        'invite-link-bar mt-2 rounded-xl border px-2.5 py-2 transition-colors',
        ok
          ? 'border-[color:var(--color-ok)] bg-[color:var(--color-ok)]/10'
          : fail
            ? 'border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10'
            : 'border-[color:var(--color-line)] bg-[color:var(--color-panel-2)]/60',
      ].join(' ')}
      style={ok ? { animation: `invite-bar-pulse 0.7s ease-out` } : undefined}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-[color:var(--color-muted)]">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-[color:var(--color-gold)]" aria-hidden />
        <span>Invite link — send this so they join your room</span>
      </div>
      <div className="flex items-stretch gap-2">
        <input
          ref={inputRef}
          data-testid="invite-url"
          readOnly
          value={props.inviteUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 truncate rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg)]/50 px-2.5 py-2 font-mono text-[11px] text-[color:var(--color-ink)] outline-none focus:border-[color:var(--color-gold)]"
          style={ok ? { animation: `invite-url-flash 0.9s ease-out` } : undefined}
        />
        <button
          type="button"
          data-testid="share-link"
          onClick={() => void onCopy()}
          className={[
            'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
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
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden />
              Copy link
            </>
          )}
        </button>
      </div>
      {fail ? (
        <p role="status" className="mt-1.5 text-[11px] text-[color:var(--color-danger)]">
          Could not copy — select the link and copy it yourself.
        </p>
      ) : null}
      {ok ? (
        <p role="status" className="mt-1.5 text-[11px] text-[color:var(--color-ok)]">
          Paste it to them. They open it and tap Join — Room codes must match.
        </p>
      ) : null}
    </div>
  );
}
