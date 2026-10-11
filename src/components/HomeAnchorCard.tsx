import { X } from 'lucide-react';
import { WELCOME_NUDGE } from '../domain/shell/pwaInstall';

interface HomeAnchorCardProps {
  onOpenSettings: () => void;
  onDismiss: () => void;
}

/** Quiet welcome nudge — one line: Settings link + dismiss. */
export function HomeAnchorCard(props: HomeAnchorCardProps) {
  return (
    <section data-testid="home-welcome" className="welcome-nudge">
      <p className="welcome-nudge__body">
        {WELCOME_NUDGE.bodyBefore}{' '}
        <button
          type="button"
          data-testid="home-welcome-settings"
          onClick={props.onOpenSettings}
          className="welcome-nudge__link"
        >
          {WELCOME_NUDGE.openSettings}
        </button>
        {WELCOME_NUDGE.bodyAfter}
      </p>
      <button
        type="button"
        data-testid="home-welcome-dismiss"
        onClick={props.onDismiss}
        className="welcome-nudge__dismiss"
        aria-label={WELCOME_NUDGE.dismiss}
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </section>
  );
}
