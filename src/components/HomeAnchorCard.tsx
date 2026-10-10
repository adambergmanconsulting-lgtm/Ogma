import {
  INSTALL_MOMENT,
  VAULT_NUDGE,
  installHowForMode,
  type HomeAnchorKind,
  type InstallOfferMode,
} from '../domain/shell/pwaInstall';

interface HomeAnchorCardProps {
  kind: HomeAnchorKind;
  installMode: InstallOfferMode;
  howOpen: boolean;
  onInstall: () => void;
  onDismissInstall: () => void;
  onVault: () => void;
  onDismissVault: () => void;
}

function installPrimaryLabel(mode: InstallOfferMode): string {
  switch (mode) {
    case 'prompt':
      return INSTALL_MOMENT.primaryPrompt;
    case 'ios':
      return INSTALL_MOMENT.primaryIos;
    case 'firefox':
      return INSTALL_MOMENT.primaryFirefox;
    default:
      return INSTALL_MOMENT.primaryManual;
  }
}

/** One Quiet Moment on home overview — install first, then optional vault key. */
export function HomeAnchorCard(props: HomeAnchorCardProps) {
  if (!props.kind) return null;

  if (props.kind === 'install') {
    const how = installHowForMode(props.installMode);
    return (
      <section data-testid="home-anchor-install" className="moment-card">
        <h2 className="text-sm font-semibold">{INSTALL_MOMENT.title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-muted)]">
          {INSTALL_MOMENT.body}
        </p>
        {props.howOpen && how ? (
          <p
            role="status"
            className="mt-2 text-xs text-[color:var(--color-ink)]"
            data-testid="home-anchor-install-how"
          >
            {how}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="home-anchor-install-primary"
            onClick={props.onInstall}
            className="btn-primary btn-primary--sm"
          >
            {installPrimaryLabel(props.installMode)}
          </button>
          <button
            type="button"
            data-testid="home-anchor-install-dismiss"
            onClick={props.onDismissInstall}
            className="btn-ghost"
          >
            {INSTALL_MOMENT.notNow}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section data-testid="home-anchor-vault" className="moment-card">
      <h2 className="text-sm font-semibold">{VAULT_NUDGE.title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-muted)]">
        {VAULT_NUDGE.body}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="home-anchor-vault-primary"
          onClick={props.onVault}
          className="btn-primary btn-primary--sm"
        >
          {VAULT_NUDGE.primary}
        </button>
        <button
          type="button"
          data-testid="home-anchor-vault-dismiss"
          onClick={props.onDismissVault}
          className="btn-ghost"
        >
          {VAULT_NUDGE.notNow}
        </button>
      </div>
    </section>
  );
}
