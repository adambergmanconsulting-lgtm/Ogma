import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  SETTINGS_INSTALL,
  installHowForMode,
  type InstallOfferMode,
} from '../domain/shell/pwaInstall';
import {
  LOOM_HONEST_COPY,
  PRIVACY_SETTINGS,
  THREAD_FREE_HONEST_COPY,
} from '../domain/thread/honestCopy';
import { TURN_SETTINGS } from '../domain/thread/iceConfig';

function settingsInstallBody(mode: InstallOfferMode): string {
  switch (mode) {
    case 'none':
      return SETTINGS_INSTALL.bodyInstalled;
    case 'prompt':
      return SETTINGS_INSTALL.bodyPrompt;
    case 'ios':
      return SETTINGS_INSTALL.bodyIos;
    case 'firefox':
      return SETTINGS_INSTALL.bodyFirefox;
    default:
      return SETTINGS_INSTALL.bodyManual;
  }
}

interface VaultSettingsProps {
  open: boolean;
  displayName: string;
  /** True when a vault key was opted in (Log out / retrieve). */
  hasVaultKey: boolean;
  installMode: InstallOfferMode;
  installHowOpen: boolean;
  turnUri: string;
  turnError: string | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onRename: (name: string) => void;
  onEnableVault: () => void;
  onInstall: () => void;
  onSaveTurnUri: (uri: string) => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
  onLogout: () => void;
  onSwitchVault: () => void;
}

/** Profile + optional vault key. */
export function VaultSettings(props: VaultSettingsProps) {
  const [name, setName] = useState(props.displayName);
  const [turnDraft, setTurnDraft] = useState(props.turnUri);

  useEffect(() => {
    if (props.open) {
      setName(props.displayName);
      setTurnDraft(props.turnUri);
    }
  }, [props.open, props.displayName, props.turnUri]);

  if (!props.open) return null;

  const turnConfigured = Boolean(props.turnUri.trim());

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
        className="drawer-sheet drawer-sheet--settings relative z-10 flex h-full flex-col overflow-y-auto"
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

        <section className="mb-8 space-y-2" data-testid="settings-you">
          <h3 className="text-sm font-semibold">You</h3>
          <p className="text-xs leading-relaxed text-[color:var(--color-muted)]">
            {props.hasVaultKey
              ? 'This vault stays in this browser. You stay signed in until Log out.'
              : 'Chats stay in this browser. A vault key is optional — only if you want to lock or move them.'}
          </p>
          <label className="block space-y-1.5">
            <span className="field-label">Your name</span>
            <input
              data-testid="vault-rename"
              type="text"
              name="displayName"
              autoComplete="nickname"
              data-1p-ignore
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field field--inset"
            />
          </label>
          <button
            type="button"
            data-testid="vault-rename-save"
            disabled={props.busy || !name.trim() || name.trim() === props.displayName}
            onClick={() => props.onRename(name.trim())}
            className="btn-secondary btn-secondary--sm w-full"
          >
            Save name
          </button>
        </section>

        {props.error ? (
          <p className="text-danger mb-4" data-testid="settings-error">
            {props.error}
          </p>
        ) : null}

        <section className="mb-8 space-y-3 text-sm" data-testid="settings-vault">
          {!props.hasVaultKey ? (
            <button
              type="button"
              data-testid="enable-vault"
              disabled={props.busy}
              onClick={props.onEnableVault}
              className="btn-primary w-full text-left"
            >
              Add vault key
            </button>
          ) : null}
          <button
            type="button"
            data-testid="export-vault"
            onClick={props.onExport}
            className="btn-secondary w-full text-left"
          >
            Export
          </button>
          <label className="btn-secondary block w-full cursor-pointer text-left">
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
              className="btn-secondary w-full text-left"
            >
              Log out
            </button>
          ) : null}
          <button
            type="button"
            data-testid="switch-vault"
            onClick={props.onSwitchVault}
            className="btn-quiet w-full text-left"
          >
            {props.hasVaultKey ? 'Switch vault' : 'Start over'}
          </button>
        </section>

        <section className="mb-8 space-y-2" data-testid="settings-install">
          <h3 className="text-sm font-semibold">{SETTINGS_INSTALL.heading}</h3>
          <p className="text-xs leading-relaxed text-[color:var(--color-muted)]">
            {settingsInstallBody(props.installMode)}
          </p>
          {props.installMode !== 'none' ? (
            <>
              {props.installHowOpen && props.installMode !== 'prompt' ? (
                <p
                  role="status"
                  className="text-xs text-[color:var(--color-ink)]"
                  data-testid="settings-install-how"
                >
                  {installHowForMode(props.installMode)}
                </p>
              ) : null}
              <button
                type="button"
                data-testid="settings-install-action"
                onClick={props.onInstall}
                className="btn-secondary btn-secondary--sm w-full text-left"
              >
                {props.installMode === 'prompt'
                  ? SETTINGS_INSTALL.actionPrompt
                  : SETTINGS_INSTALL.actionHow}
              </button>
            </>
          ) : null}
        </section>

        <details className="mb-6" data-testid="settings-privacy">
          <summary className="cursor-pointer select-none text-sm font-semibold text-[color:var(--color-ink)]">
            {PRIVACY_SETTINGS.summary}
          </summary>
          <div className="mt-3 space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-[color:var(--color-ink)]">
                {PRIVACY_SETTINGS.threadLabel}
              </p>
              <p
                data-testid="settings-privacy-thread"
                className="text-xs leading-relaxed text-[color:var(--color-muted)]"
              >
                {THREAD_FREE_HONEST_COPY}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-[color:var(--color-ink)]">
                {PRIVACY_SETTINGS.loomLabel}
              </p>
              <p
                data-testid="settings-privacy-loom"
                className="text-xs leading-relaxed text-[color:var(--color-muted)]"
              >
                {LOOM_HONEST_COPY}
              </p>
            </div>
          </div>
        </details>

        <details
          className="mb-2"
          data-testid="settings-turn"
          open={turnConfigured || Boolean(props.turnError)}
        >
          <summary className="cursor-pointer select-none text-sm font-semibold text-[color:var(--color-ink)]">
            {TURN_SETTINGS.summary}
          </summary>
          <div className="mt-3 space-y-2">
            <p className="text-xs leading-relaxed text-[color:var(--color-muted)]">
              {TURN_SETTINGS.body}
            </p>
            <label className="block space-y-1.5">
              <span className="field-label">{TURN_SETTINGS.label}</span>
              <input
                data-testid="settings-turn-uri"
                type="text"
                name="turnUri"
                autoComplete="off"
                spellCheck={false}
                placeholder={TURN_SETTINGS.placeholder}
                value={turnDraft}
                onChange={(e) => setTurnDraft(e.target.value)}
                className="field field--inset"
              />
            </label>
            {props.turnError ? (
              <p className="text-danger text-xs" data-testid="settings-turn-error">
                {props.turnError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="settings-turn-save"
                onClick={() => props.onSaveTurnUri(turnDraft)}
                className="btn-secondary btn-secondary--sm"
              >
                {TURN_SETTINGS.save}
              </button>
              {turnDraft.trim() || props.turnUri ? (
                <button
                  type="button"
                  data-testid="settings-turn-clear"
                  onClick={() => {
                    setTurnDraft('');
                    props.onSaveTurnUri('');
                  }}
                  className="btn-quiet"
                >
                  {TURN_SETTINGS.clear}
                </button>
              ) : null}
            </div>
          </div>
        </details>
      </aside>
    </div>
  );
}
