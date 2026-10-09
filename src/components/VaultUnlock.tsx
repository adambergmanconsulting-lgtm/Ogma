import { useState } from 'react';
import { OghamMark } from './OghamMark';

interface VaultUnlockProps {
  busy: boolean;
  error: string | null;
  onUnlock: (vaultKey: string) => void;
  onBack: () => void;
}

/** Open a vault on this browser with its vault key. */
export function VaultUnlock({ busy, error, onUnlock, onBack }: VaultUnlockProps) {
  const [key, setKey] = useState('');

  return (
    <div className="app-gutter-x mx-auto flex min-h-full w-full max-w-sm flex-col justify-center py-12 fade-up">
      <h1 className="mb-2 flex items-center gap-3 font-[family-name:var(--font-display)] text-3xl tracking-tight">
        <OghamMark className="h-8 w-auto shrink-0 text-[color:var(--color-gold)]" />
        <span>Open vault</span>
      </h1>
      <p className="mb-8 text-sm text-[color:var(--color-muted)]">
        Enter the vault key for the vault on this browser.
      </p>

      <label className="mb-4 block space-y-1.5">
        <span className="text-sm text-[color:var(--color-muted)]">Vault key</span>
        <input
          data-testid="vault-unlock-key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)]/80 px-3 py-2.5 font-mono text-sm outline-none focus:border-[color:var(--color-gold)]"
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      {error ? <p className="mb-3 text-sm text-[color:var(--color-danger)]">{error}</p> : null}

      <button
        type="button"
        data-testid="vault-unlock"
        disabled={busy || !key.trim()}
        onClick={() => onUnlock(key.trim())}
        className="mb-5 w-full rounded-xl bg-[color:var(--color-gold)] px-4 py-3 font-semibold text-[color:var(--color-on-gold)] disabled:opacity-60"
      >
        Open
      </button>

      <button
        type="button"
        data-testid="switch-vault"
        onClick={onBack}
        className="text-sm text-[color:var(--color-muted)] underline-offset-2 hover:underline"
      >
        Back
      </button>
    </div>
  );
}
