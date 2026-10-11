import { Settings } from 'lucide-react';
import { AppearActive } from './PersonReach';
import { OghamMark } from './OghamMark';

export type AppNavPlace = 'home' | 'space' | 'call';

interface AppNavProps {
  place: AppNavPlace;
  onHome: () => void;
  onSettings: () => void;
  settingsOpen?: boolean;
  /** This person, for the whole app. Absent until a vault has an id. */
  appearActive?: boolean;
  onToggleAppearActive?: () => void;
}

/**
 * Permanent top fixture: brand (focus All) · Active · Settings.
 * Create lives on the This chat | All row. Call for the open space is on video.
 */
export function AppNav(props: AppNavProps) {
  return (
    <header
      data-testid="app-nav"
      className="shrink-0 border-b border-[color:var(--color-line)]/70 bg-[color:var(--color-panel)]/90 backdrop-blur-sm"
    >
      <div className="space-pane-pad flex items-center gap-2 py-2 sm:gap-3">
        <button
          type="button"
          data-testid="nav-home"
          onClick={props.onHome}
          aria-label="All chats"
          aria-current={props.place === 'home' ? 'page' : undefined}
          className="flex min-w-0 items-center gap-2 rounded-xl py-1 text-left transition hover:opacity-90"
        >
          <OghamMark className="h-6 w-auto shrink-0 text-[color:var(--color-gold)]" />
          <span className="brand-wordmark truncate text-lg">Ogma</span>
        </button>

        <div className="min-w-0 flex-1" />

        {props.onToggleAppearActive ? (
          <AppearActive
            testId="nav-appear-active"
            active={Boolean(props.appearActive)}
            onToggle={props.onToggleAppearActive}
          />
        ) : null}

        <button
          type="button"
          data-testid="nav-settings"
          title="Settings"
          aria-label="Settings"
          aria-pressed={props.settingsOpen}
          onClick={props.onSettings}
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition',
            props.settingsOpen
              ? 'bg-[color:var(--color-panel-2)] text-[color:var(--color-ink)]'
              : 'text-[color:var(--color-muted)] hover:bg-[color:var(--color-panel-2)] hover:text-[color:var(--color-ink)]',
          ].join(' ')}
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
