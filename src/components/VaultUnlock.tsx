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
    <div className="app-gutter-x gate-shell fade-up">
      <div className="mb-6 flex items-center gap-2">
        <OghamMark className="h-7 w-auto shrink-0 text-[color:var(--color-gold)]" />
        <span className="brand-wordmark text-lg">Ogma</span>
      </div>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Open vault</h1>
      <p className="text-muted mb-8">Enter the vault key for the vault on this browser.</p>

      <label className="mb-4 block space-y-1.5">
        <span className="field-label">Vault key</span>
        <input
          data-testid="vault-unlock-key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="field font-mono text-sm"
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      {error ? <p className="text-danger mb-3">{error}</p> : null}

      <button
        type="button"
        data-testid="vault-unlock"
        disabled={busy || !key.trim()}
        onClick={() => onUnlock(key.trim())}
        className="btn-primary mb-5 w-full"
      >
        Open
      </button>

      <button type="button" data-testid="switch-vault" onClick={onBack} className="btn-quiet">
        Back
      </button>
    </div>
  );
}
