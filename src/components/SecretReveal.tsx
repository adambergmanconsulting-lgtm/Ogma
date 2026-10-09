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

/** Moment: show the only secret the user must keep, and why. */
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
    <div className="app-gutter-x mx-auto flex min-h-full w-full max-w-sm flex-col justify-center py-12 fade-up">
      <h1 className="mb-4 flex items-center gap-3 font-[family-name:var(--font-display)] text-3xl tracking-tight">
        <OghamMark className="h-8 w-auto shrink-0 text-[color:var(--color-gold)]" />
        <span>{title}</span>
      </h1>
      <p className="mb-5 text-sm text-[color:var(--color-muted)]">{why}</p>
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
        className="mb-8 w-full rounded-xl border border-[color:var(--color-line)] px-4 py-3 font-semibold"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button
        type="button"
        data-testid="secret-continue"
        disabled={busy}
        onClick={onContinue}
        className="w-full rounded-xl bg-[color:var(--color-gold)] px-4 py-3 font-semibold text-[color:var(--color-on-gold)] disabled:opacity-60"
      >
        {continueLabel}
      </button>
    </div>
  );
}
