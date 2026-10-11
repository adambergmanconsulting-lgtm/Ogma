import {
  SETTINGS_SETUP,
  installHowForMode,
  type InstallOfferMode,
} from '../domain/shell/pwaInstall';

interface SettingsSetupSplashProps {
  installMode: InstallOfferMode;
  hasVaultKey: boolean;
  busy: boolean;
  onInstall: () => void;
  onEnableVault: () => void;
}

/** Foldable plain text: pin Ogma and/or (legacy) add a vault key. */
export function SettingsSetupSplash(props: SettingsSetupSplashProps) {
  const showInstall = props.installMode !== 'none';
  const showVault = !props.hasVaultKey;
  if (!showInstall && !showVault) return null;

  const how =
    showInstall && props.installMode !== 'prompt' ? installHowForMode(props.installMode) : null;

  return (
    <details data-testid="settings-setup" className="settings-fold settings-section">
      <summary className="settings-fold__title">{SETTINGS_SETUP.title}</summary>
      <div className="settings-fold__body">
        {showInstall ? (
          <div>
            <p
              className="settings-section__hint mb-0"
              data-testid={how ? 'settings-setup-install-how' : undefined}
            >
              {SETTINGS_SETUP.installWhy}
              {how ? ` ${how}` : ''}
            </p>
            {props.installMode === 'prompt' ? (
              <button
                type="button"
                data-testid="settings-install-action"
                onClick={props.onInstall}
                className="btn-secondary btn-secondary--sm mt-2 w-full text-left"
              >
                {SETTINGS_SETUP.installAction}
              </button>
            ) : null}
          </div>
        ) : null}
        {showVault ? (
          <div>
            <p className="settings-section__hint mb-0">{SETTINGS_SETUP.vaultWhy}</p>
            <button
              type="button"
              data-testid="enable-vault"
              disabled={props.busy}
              onClick={props.onEnableVault}
              className="btn-primary btn-primary--sm mt-2 w-full text-left"
            >
              {SETTINGS_SETUP.vaultAction}
            </button>
          </div>
        ) : null}
      </div>
    </details>
  );
}
