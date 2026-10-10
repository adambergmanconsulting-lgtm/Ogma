import { useState } from 'react';
import { OghamMark } from './OghamMark';

interface SecretRevealProps {
  title: string;
  why: string;
  secret: string;
  busy?: boolean;
  onContinue: () => void;
  continueLabel?: string;
}

/** Moment: vault key (must keep). Space invites live on the open chat. */
export function SecretReveal({
  title,
  why,
  secret,
  busy,
  onContinue,
  continueLabel = 'Continue',
}: SecretRevealProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="app-gutter-x gate-shell fade-up">
      <div className="mb-6 flex items-center gap-2">
        <OghamMark className="h-7 w-auto shrink-0 text-[color:var(--color-gold)]" />
        <span className="brand-wordmark text-lg">Ogma</span>
      </div>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted mb-5">{why}</p>
      <div
        data-testid="secret-value"
        className="mb-3 break-all rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)]/80 px-3 py-3 font-mono text-sm"
      >
        {secret}
      </div>
      <button
        type="button"
        data-testid="secret-copy"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(secret);
          } catch {
            // ignore
          }
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
        className="btn-secondary mb-8 w-full"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button
        type="button"
        data-testid="secret-continue"
        disabled={busy}
        onClick={onContinue}
        className="btn-primary w-full"
      >
        {continueLabel}
      </button>
    </div>
  );
}
