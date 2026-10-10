import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { OghamMark } from './OghamMark';

interface VaultSetupProps {
  busy: boolean;
  error: string | null;
  /** Name only — use Chats/Call without a vault key. */
  onContinue: (displayName: string) => void;
  /** Name + new vault key (shown next). */
  onCreateVault: (displayName: string) => void;
  /** Open a vault already on this browser (after Log out). */
  onOpenVault: () => void;
  /** True when this browser already has a vault key to open. */
  onProbeVault: () => Promise<boolean>;
}

/** Cold start: Continue without vault; vault via quiet splash. */
export function VaultSetup({
  busy,
  error,
  onContinue,
  onCreateVault,
  onOpenVault,
  onProbeVault,
}: VaultSetupProps) {
  const [name, setName] = useState(() => localStorage.getItem('ogma.displayName') || '');
  const [vaultSplash, setVaultSplash] = useState(false);
  /** null = still checking; false = empty browser; true = can open. */
  const [canOpenVault, setCanOpenVault] = useState<boolean | null>(null);
  const ready = Boolean(name.trim()) && !busy;

  useEffect(() => {
    if (!vaultSplash) {
      setCanOpenVault(null);
      return;
    }
    let cancelled = false;
    setCanOpenVault(null);
    void onProbeVault().then((ok) => {
      if (!cancelled) setCanOpenVault(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [vaultSplash, onProbeVault]);

  const nameField = (
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
        autoFocus={!vaultSplash}
      />
    </label>
  );

  return (
    <div className="app-gutter-x gate-shell relative fade-up">
      <h1 className="mb-10 flex items-center gap-3 text-5xl tracking-tight">
        <OghamMark className="h-11 w-auto shrink-0 text-[color:var(--color-gold)]" />
        <span className="brand-wordmark">Ogma</span>
      </h1>

      <div className="mb-4">{nameField}</div>

      {error && !vaultSplash ? <p className="text-danger mb-3">{error}</p> : null}

      <button
        type="button"
        data-testid="name-continue"
        disabled={!ready}
        onClick={() => onContinue(name.trim())}
        className="btn-primary mb-8 w-full"
      >
        Continue
      </button>

      <button
        type="button"
        data-testid="vault-splash-open"
        disabled={busy}
        onClick={() => setVaultSplash(true)}
        className="btn-quiet"
      >
        Use a vault
      </button>

      {vaultSplash ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="presentation"
          onClick={() => setVaultSplash(false)}
        >
          <div
            data-testid="vault-splash"
            role="dialog"
            aria-labelledby="vault-splash-title"
            className="relative z-10 w-full max-w-sm rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-5 py-6 shadow-xl fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 id="vault-splash-title" className="text-xl font-semibold tracking-tight">
                Vault
              </h2>
              <button
                type="button"
                data-testid="vault-splash-close"
                onClick={() => setVaultSplash(false)}
                className="rounded-lg p-1.5 text-[color:var(--color-muted)] hover:bg-[color:var(--color-panel-2)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-muted mb-5 leading-relaxed">
              A vault locks this browser&apos;s chats behind a key you keep. Use it if you want to
              log out safely, or move chats with Export / Import. You can skip it and Continue with
              just a name.
            </p>

            <div className="mb-4">
              <label className="block space-y-1.5">
                <span className="field-label">Your name</span>
                <input
                  data-testid="vault-splash-name"
                  type="text"
                  name="displayName"
                  autoComplete="nickname"
                  data-1p-ignore
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field field--inset"
                  autoFocus
                />
              </label>
            </div>

            {error ? <p className="text-danger mb-4">{error}</p> : null}

            {canOpenVault === false && !error ? (
              <p data-testid="vault-splash-empty" className="text-muted mb-4">
                No vault on this browser yet. Create one, or close and Continue.
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                data-testid="vault-create"
                disabled={!ready}
                onClick={() => onCreateVault(name.trim())}
                className="btn-primary w-full"
              >
                Create vault
              </button>
              <button
                type="button"
                data-testid="vault-open"
                disabled={busy || canOpenVault !== true}
                onClick={onOpenVault}
                className="btn-secondary w-full"
              >
                Open vault
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
