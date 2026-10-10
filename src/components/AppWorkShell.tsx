import type { ReactNode } from 'react';
import type { HomeAnchorKind, InstallOfferMode } from '../domain/shell/pwaInstall';
import { HomeAnchorCard } from './HomeAnchorCard';

interface AppWorkShellProps {
  workspace: ReactNode;
  homeAnchor: HomeAnchorKind;
  installMode: InstallOfferMode;
  installHowOpen: boolean;
  onInstall: () => void;
  onDismissInstall: () => void;
  onVaultNudge: () => void;
  onDismissVaultNudge: () => void;
}

/** Video | Chat. Moments only while an install or vault nudge is active. */
export function AppWorkShell(props: AppWorkShellProps) {
  return (
    <div data-testid="app-work-shell" className="relative flex h-full min-h-0 flex-col">
      {props.homeAnchor ? (
        <div className="app-gutter-x shrink-0 pt-2">
          <HomeAnchorCard
            kind={props.homeAnchor}
            installMode={props.installMode}
            howOpen={props.installHowOpen}
            onInstall={props.onInstall}
            onDismissInstall={props.onDismissInstall}
            onVault={props.onVaultNudge}
            onDismissVault={props.onDismissVaultNudge}
          />
        </div>
      ) : null}
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">{props.workspace}</div>
    </div>
  );
}
