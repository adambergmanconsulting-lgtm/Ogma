import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface VaultSettingsProps {
  open: boolean;
  displayName: string;
  /** True when a vault key was opted in (Log out / retrieve). */
  hasVaultKey: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onRename: (name: string) => void;
  onEnableVault: () => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
  onLogout: () => void;
  onSwitchVault: () => void;
}

/** Profile + optional vault key. */
export function VaultSettings(props: VaultSettingsProps) {
  const [name, setName] = useState(props.displayName);

  useEffect(() => {
    if (props.open) setName(props.displayName);
  }, [props.open, props.displayName]);

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close settings"
        onClick={props.onClose}
      />
      <aside
        data-testid="vault-settings"
        className="relative z-10 flex h-full w-full max-w-sm flex-col border-l border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-5 py-6 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
          <button
            type="button"
            data-testid="vault-settings-close"
            onClick={props.onClose}
            className="rounded-lg p-2 text-[color:var(--color-muted)] hover:bg-[color:var(--color-panel-2)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-6 text-xs leading-relaxed text-[color:var(--color-muted)]">
          {props.hasVaultKey
            ? 'This vault stays in this browser. You stay signed in until Log out.'
            : 'Chats stay in this browser. A vault key is optional — only if you want to lock or move them.'}
        </p>

        <label className="mb-2 block space-y-1.5">
          <span className="text-sm text-[color:var(--color-muted)]">Your name</span>
          <input
            data-testid="vault-rename"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-bg)] px-3 py-2.5 outline-none focus:border-[color:var(--color-gold)]"
          />
        </label>
        <button
          type="button"
          data-testid="vault-rename-save"
          disabled={props.busy || !name.trim() || name.trim() === props.displayName}
          onClick={() => props.onRename(name.trim())}
          className="mb-8 w-full rounded-xl border border-[color:var(--color-line)] px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          Save name
        </button>

        {props.error ? (
          <p className="mb-4 text-sm text-[color:var(--color-danger)]">{props.error}</p>
        ) : null}

        <div className="space-y-3 text-sm">
          {!props.hasVaultKey ? (
            <button
              type="button"
              data-testid="enable-vault"
              disabled={props.busy}
              onClick={props.onEnableVault}
              className="block w-full rounded-xl bg-[color:var(--color-gold)] px-4 py-2.5 text-left font-semibold text-[color:var(--color-on-gold)] disabled:opacity-60"
            >
              Add vault key
            </button>
          ) : null}
          <button
            type="button"
            data-testid="export-vault"
            onClick={props.onExport}
            className="block w-full rounded-xl border border-[color:var(--color-line)] px-4 py-2.5 text-left font-semibold"
          >
            Export
          </button>
          <label className="block w-full cursor-pointer rounded-xl border border-[color:var(--color-line)] px-4 py-2.5 font-semibold">
            Import
            <input
              data-testid="import-vault"
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) props.onImportFile(file);
                e.target.value = '';
              }}
            />
          </label>
          {props.hasVaultKey ? (
            <button
              type="button"
              data-testid="vault-logout"
              onClick={props.onLogout}
              className="block w-full rounded-xl border border-[color:var(--color-line)] px-4 py-2.5 text-left font-semibold"
            >
              Log out
            </button>
          ) : null}
          <button
            type="button"
            data-testid="switch-vault"
            onClick={props.onSwitchVault}
            className="block w-full rounded-xl px-4 py-2.5 text-left text-[color:var(--color-muted)] underline-offset-2 hover:underline"
          >
            {props.hasVaultKey ? 'Switch vault' : 'Start over'}
          </button>
        </div>
      </aside>
    </div>
  );
}
