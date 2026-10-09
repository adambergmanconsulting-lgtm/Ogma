import { useState } from 'react';
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
}

/** Cold start: Continue without vault; vault via quiet splash. */
export function VaultSetup({
  busy,
  error,
  onContinue,
  onCreateVault,
  onOpenVault,
}: VaultSetupProps) {
  const [name, setName] = useState(() => localStorage.getItem('ogma.displayName') || '');
  const [vaultSplash, setVaultSplash] = useState(false);
  const ready = Boolean(name.trim()) && !busy;

  return (
    <div className="app-gutter-x relative mx-auto flex min-h-full w-full max-w-sm flex-col justify-center py-12 fade-up">
      <h1 className="mb-10 flex items-center gap-3 font-[family-name:var(--font-display)] text-5xl tracking-tight">
        <OghamMark className="h-11 w-auto shrink-0 text-[color:var(--color-gold)]" />
        <span>Ogma</span>
      </h1>

      <label className="mb-4 block space-y-1.5">
        <span className="text-sm text-[color:var(--color-muted)]">Your name</span>
        <input
          data-testid="vault-name"
          type="text"
          name="displayName"
          autoComplete="nickname"
          data-1p-ignore
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)]/80 px-3 py-2.5 outline-none focus:border-[color:var(--color-gold)]"
          autoFocus
        />
      </label>

      {error && !vaultSplash ? (
        <p className="mb-3 text-sm text-[color:var(--color-danger)]">{error}</p>
      ) : null}

      <button
        type="button"
        data-testid="name-continue"
        disabled={!ready}
        onClick={() => onContinue(name.trim())}
        className="mb-8 w-full rounded-xl bg-[color:var(--color-gold)] px-4 py-3 font-semibold text-[color:var(--color-on-gold)] disabled:opacity-60"
      >
        Continue
      </button>

      <button
        type="button"
        data-testid="vault-splash-open"
        disabled={busy}
        onClick={() => setVaultSplash(true)}
        className="text-sm text-[color:var(--color-muted)] underline-offset-2 hover:underline disabled:opacity-60"
      >
        Use a vault
      </button>

      {vaultSplash ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close"
            onClick={() => setVaultSplash(false)}
          />
          <div
            data-testid="vault-splash"
            role="dialog"
            aria-labelledby="vault-splash-title"
            className="relative z-10 w-full max-w-sm rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-5 py-6 shadow-xl fade-up"
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2
                id="vault-splash-title"
                className="font-[family-name:var(--font-display)] text-2xl tracking-tight"
              >
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

            <p className="mb-6 text-sm leading-relaxed text-[color:var(--color-muted)]">
              A vault locks this browser&apos;s chats behind a key you keep. Use it if you want to
              log out safely, or move chats with Export / Import. You can skip it and Continue with
              just a name.
            </p>

            {error ? (
              <p className="mb-4 text-sm text-[color:var(--color-danger)]">{error}</p>
            ) : null}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                data-testid="vault-create"
                disabled={!ready}
                onClick={() => onCreateVault(name.trim())}
                className="w-full rounded-xl bg-[color:var(--color-gold)] px-4 py-3 font-semibold text-[color:var(--color-on-gold)] disabled:opacity-60"
              >
                Create vault
              </button>
              <button
                type="button"
                data-testid="vault-open"
                disabled={busy}
                onClick={onOpenVault}
                className="w-full rounded-xl border border-[color:var(--color-line)] px-4 py-3 font-semibold disabled:opacity-60"
              >
                Open vault
              </button>
            </div>

            {!name.trim() ? (
              <p className="mt-4 text-xs text-[color:var(--color-muted)]">
                Enter your name above to create a vault.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
