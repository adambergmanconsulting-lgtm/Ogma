import type { ReactNode } from 'react';
import { HomeAnchorCard } from './HomeAnchorCard';

interface AppWorkShellProps {
  workspace: ReactNode;
  welcome: boolean;
  onOpenSettings: () => void;
  onDismissWelcome: () => void;
}

/** Video | Chat. Quiet welcome nudge only while setup remains and not dismissed. */
export function AppWorkShell(props: AppWorkShellProps) {
  return (
    <div data-testid="app-work-shell" className="relative flex h-full min-h-0 flex-col">
      {props.welcome ? (
        <div className="app-gutter-x shrink-0 pt-2">
          <HomeAnchorCard
            onOpenSettings={props.onOpenSettings}
            onDismiss={props.onDismissWelcome}
          />
        </div>
      ) : null}
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">{props.workspace}</div>
    </div>
  );
}
