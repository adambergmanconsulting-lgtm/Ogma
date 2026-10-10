import { MessageSquare, Phone, Settings } from 'lucide-react';
import { OghamMark } from './OghamMark';

export type AppNavPlace = 'home' | 'space' | 'call';

interface AppNavProps {
  place: AppNavPlace;
  busy?: boolean;
  onHome: () => void;
  onStartChat: () => void;
  onStartCall: () => void;
  onSettings: () => void;
  settingsOpen?: boolean;
}

/**
 * Permanent top fixture: brand (focus Spaces tab) · Start new · Settings.
 * Call for the open space lives on the video pane — not in global chrome.
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
          aria-label="Spaces"
          aria-current={props.place === 'home' ? 'page' : undefined}
          className="flex min-w-0 items-center gap-2 rounded-xl py-1 text-left transition hover:opacity-90"
        >
          <OghamMark className="h-6 w-auto shrink-0 text-[color:var(--color-gold)]" />
          <span className="brand-wordmark truncate text-lg">Ogma</span>
        </button>

        <div className="min-w-0 flex-1" />

        <div data-testid="home-start-new" className="flex shrink-0 items-center gap-2">
          <span className="hidden text-[13px] font-medium text-[color:var(--color-muted)] sm:inline">
            Start new
          </span>
          <button
            type="button"
            data-testid="home-chat"
            disabled={props.busy}
            onClick={props.onStartChat}
            className="link-action"
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            Chat
          </button>
          <button
            type="button"
            data-testid="home-call"
            disabled={props.busy}
            onClick={props.onStartCall}
            className="link-action"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            Call
          </button>
        </div>

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
