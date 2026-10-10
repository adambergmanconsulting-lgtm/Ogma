import { Settings } from 'lucide-react';
import { OghamMark } from './OghamMark';

export type AppNavPlace = 'home' | 'space' | 'call';

interface AppNavProps {
  place: AppNavPlace;
  onHome: () => void;
  onSettings: () => void;
}

/**
 * Permanent top fixture: brand (home) · Settings; full-bleed + gutter.
 * Call lives on the space video pane — not in global chrome.
 */
export function AppNav(props: AppNavProps) {
  return (
    <header
      data-testid="app-nav"
      className="shrink-0 border-b border-[color:var(--color-line)]/70 bg-[color:var(--color-panel)]/90 backdrop-blur-sm"
    >
      <div className="app-gutter-x flex items-center gap-2 py-2 sm:gap-3">
        <button
          type="button"
          data-testid="nav-home"
          onClick={props.onHome}
          aria-label="Ogma home"
          aria-current={props.place === 'home' ? 'page' : undefined}
          className="flex min-w-0 items-center gap-2 rounded-xl py-1 text-left transition hover:opacity-90"
        >
          <OghamMark className="h-6 w-auto shrink-0 text-[color:var(--color-gold)]" />
          <span className="brand-wordmark truncate text-lg">Ogma</span>
        </button>

        <div className="min-w-0 flex-1" />

        <button
          type="button"
          data-testid="nav-settings"
          title="Settings"
          aria-label="Settings"
          onClick={props.onSettings}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-panel-2)] hover:text-[color:var(--color-ink)]"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
