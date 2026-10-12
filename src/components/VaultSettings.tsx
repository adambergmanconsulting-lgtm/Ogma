import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PersonIdMark } from './PersonIdMark';
import { AppearActive } from './PersonReach';
import { settingsBuildStampLabel } from '../domain/shell/buildStamp';
import {
  SETTINGS_INSTALL,
  shouldShowSettingsSetup,
  type InstallOfferMode,
} from '../domain/shell/pwaInstall';
import { SettingsSetupSplash } from './SettingsSetupSplash';
import {
  LOOM_HONEST_COPY,
  PRIVACY_SETTINGS,
  THREAD_FREE_HONEST_COPY,
} from '../domain/thread/honestCopy';
import { ALERT_SETTINGS } from '../domain/loom/chatSoundSettings';
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
  /** True when a vault key exists (Log out / retrieve). */
  hasVaultKey: boolean;
  /** Public person id for this vault. Absent until a vault key exists. */
  personId?: string | null;
  appearActive?: boolean;
  tabVisible?: boolean;
  onToggleAppearActive?: () => void;
  installMode: InstallOfferMode;
  turnUri: string;
  turnError: string | null;
  busy: boolean;
  error: string | null;
  chatSoundEnabled: boolean;
  onChatSoundEnabledChange: (enabled: boolean) => void;
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

/** Settings drawer: You → Vault → Home screen → folded Alerts / Privacy / Network. */
export function VaultSettings(props: VaultSettingsProps) {
  const buildStamp = settingsBuildStampLabel();
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
  const setupOpen = shouldShowSettingsSetup({
    installMode: props.installMode,
    hasVaultKey: props.hasVaultKey,
  });
  const setupCoversInstall = setupOpen && props.installMode !== 'none';
  const setupCoversVault = setupOpen && !props.hasVaultKey;
  const nameDirty = Boolean(name.trim()) && name.trim() !== props.displayName;

  return (
    <div className="absolute inset-0 z-50 flex justify-end bg-black/40" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close settings"
        onClick={props.onClose}
      />
      <aside
        data-testid="vault-settings"
        className="drawer-sheet drawer-sheet--settings relative z-10 flex h-full min-h-0 flex-col"
      >
        <div className="settings-head">
          <h2 className="font-semibold tracking-tight">Settings</h2>
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

        <div className="drawer-sheet__scroll">
        {setupOpen ? (
          <SettingsSetupSplash
            installMode={props.installMode}
            hasVaultKey={props.hasVaultKey}
            busy={props.busy}
            onInstall={props.onInstall}
            onEnableVault={props.onEnableVault}
          />
        ) : null}

        <section className="settings-section" data-testid="settings-you">
          <h3 className="settings-section__title">You</h3>
          <div className="space-y-1.5">
            <label className="field-label" htmlFor="vault-display-name">
              Your name
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="vault-display-name"
                data-testid="vault-rename"
                type="text"
                name="displayName"
                autoComplete="nickname"
                data-1p-ignore
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field field--inset min-w-0 flex-1"
              />
              {props.personId ? <PersonIdMark id={props.personId} /> : null}
            </div>
          </div>
          <button
            type="button"
            data-testid="vault-rename-save"
            disabled={props.busy || !nameDirty}
            onClick={() => props.onRename(name.trim())}
            className="btn-secondary btn-secondary--sm mt-1.5 w-full"
          >
            Save name
          </button>
          {props.personId && props.onToggleAppearActive ? (
            <div className="settings-row mt-2">
              <p className="settings-section__hint mb-0 min-w-0 flex-1">
                While Ogma is open, people who know you can invite you.
              </p>
              <AppearActive
                active={Boolean(props.appearActive && props.tabVisible)}
                onToggle={props.onToggleAppearActive}
                testId="settings-appear-active"
              />
            </div>
          ) : null}
        </section>

        <section className="settings-section" data-testid="settings-vault">
          <h3 className="settings-section__title">Vault</h3>
          <p className="settings-section__hint">
            {props.hasVaultKey
              ? 'Chats for this vault stay in this browser. You stay signed in until Log out.'
              : 'Chats stay in this browser. Add a vault key to lock them or move them with Export / Import.'}
          </p>
          {props.error ? (
            <p className="text-danger mb-1.5 text-xs" data-testid="settings-error">
              {props.error}
            </p>
          ) : null}
          <div className="settings-actions">
            {!props.hasVaultKey && !setupCoversVault ? (
              <button
                type="button"
                data-testid="enable-vault"
                disabled={props.busy}
                onClick={props.onEnableVault}
                className="btn-primary btn-primary--sm w-full text-left"
              >
                Add vault key
              </button>
            ) : null}
            <div className="settings-actions__pair">
              <button
                type="button"
                data-testid="export-vault"
                onClick={props.onExport}
                className="btn-secondary btn-secondary--sm w-full"
              >
                Export
              </button>
              <label className="btn-secondary btn-secondary--sm block w-full cursor-pointer text-center">
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
            </div>
            {props.hasVaultKey ? (
              <button
                type="button"
                data-testid="vault-logout"
                onClick={props.onLogout}
                className="btn-secondary btn-secondary--sm w-full text-left"
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
            {props.hasVaultKey ? (
              <p className="settings-section__hint mb-0">
                Switch vault erases chats saved in this browser after you Continue.
              </p>
            ) : null}
          </div>
        </section>

        {!setupCoversInstall ? (
          <section className="settings-section" data-testid="settings-install">
            <h3 className="settings-section__title">{SETTINGS_INSTALL.heading}</h3>
            <p className="settings-section__hint mb-0">{settingsInstallBody(props.installMode)}</p>
            {props.installMode === 'prompt' ? (
              <button
                type="button"
                data-testid="settings-install-action"
                onClick={props.onInstall}
                className="btn-secondary btn-secondary--sm mt-2 w-full text-left"
              >
                {SETTINGS_INSTALL.actionPrompt}
              </button>
            ) : null}
          </section>
        ) : null}

        <div className="settings-folds">
          <details className="settings-fold" data-testid="settings-alerts">
            <summary className="settings-fold__title">{ALERT_SETTINGS.summary}</summary>
            <div className="settings-fold__body">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  data-testid="settings-chat-sound"
                  type="checkbox"
                  className="mt-1"
                  checked={props.chatSoundEnabled}
                  onChange={(e) => props.onChatSoundEnabledChange(e.target.checked)}
                />
                <span className="min-w-0 space-y-1">
                  <span className="block text-sm font-medium text-[color:var(--color-ink)]">
                    {ALERT_SETTINGS.chatSoundLabel}
                  </span>
                  <span className="settings-section__hint mb-0 block">
                    {ALERT_SETTINGS.chatSoundBody}
                  </span>
                </span>
              </label>
              <p className="settings-section__hint mb-0">{ALERT_SETTINGS.callRingBody}</p>
            </div>
          </details>

          <details className="settings-fold" data-testid="settings-privacy">
            <summary className="settings-fold__title">{PRIVACY_SETTINGS.summary}</summary>
            <div className="settings-fold__body">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[color:var(--color-ink)]">
                  {PRIVACY_SETTINGS.threadLabel}
                </p>
                <p
                  data-testid="settings-privacy-thread"
                  className="settings-section__hint mb-0"
                >
                  {THREAD_FREE_HONEST_COPY}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-[color:var(--color-ink)]">
                  {PRIVACY_SETTINGS.loomLabel}
                </p>
                <p data-testid="settings-privacy-loom" className="settings-section__hint mb-0">
                  {LOOM_HONEST_COPY}
                </p>
              </div>
            </div>
          </details>

          <details
            className="settings-fold"
            data-testid="settings-turn"
            open={turnConfigured || Boolean(props.turnError)}
          >
            <summary className="settings-fold__title">{TURN_SETTINGS.summary}</summary>
            <div className="settings-fold__body">
              <p className="settings-section__hint mb-0">{TURN_SETTINGS.body}</p>
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
        </div>

        {buildStamp ? (
          <p
            data-testid="settings-build-stamp"
            className="pt-3 text-[11px] leading-snug text-[color:var(--color-muted)]"
          >
            {buildStamp}
          </p>
        ) : null}
        </div>
      </aside>
    </div>
  );
}
