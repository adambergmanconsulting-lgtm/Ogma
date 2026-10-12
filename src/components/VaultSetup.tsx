import { useState } from 'react';
import { OghamMark } from './OghamMark';

interface VaultSetupProps {
  busy: boolean;
  error: string | null;
  /** Name only — vault key comes later on New or Settings → Add vault key. */
  onCreateVault: (displayName: string) => void;
}

/** Cold start: Continue enters the shell with a name; no vault key yet. */
export function VaultSetup({ busy, error, onCreateVault }: VaultSetupProps) {
  const [name, setName] = useState(() => localStorage.getItem('ogma.displayName') || '');
  const ready = Boolean(name.trim()) && !busy;

  return (
    <div className="app-gutter-x gate-shell relative fade-up">
      <h1 className="mb-10 flex items-center gap-3 text-5xl tracking-tight">
        <OghamMark className="h-11 w-auto shrink-0 text-[color:var(--color-gold)]" />
        <span className="brand-wordmark">Ogma</span>
      </h1>

      <div className="mb-4">
        <label className="block space-y-1.5">
          <span className="field-label">Your name</span>
          <input
            data-testid="vault-name"
            type="text"
            name="displayName"
            autoComplete="nickname"
            data-1p-ignore
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
            autoFocus
          />
        </label>
      </div>

      <p className="text-muted mb-4 text-sm leading-relaxed">
        Continue opens Ogma with this name. Join an invite without a vault key. Starting a new chat
        creates a vault key once so chats can stay on this browser. Continue also erases any earlier
        vault saved here.
      </p>

      {error ? <p className="text-danger mb-3">{error}</p> : null}

      <button
        type="button"
        data-testid="name-continue"
        disabled={!ready}
        onClick={() => onCreateVault(name.trim())}
        className="btn-primary w-full"
      >
        Continue
      </button>
    </div>
  );
}
