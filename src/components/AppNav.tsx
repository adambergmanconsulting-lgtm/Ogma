import type { ReactNode } from 'react';
import { MessageSquare, Phone, Settings } from 'lucide-react';
import { OghamMark } from './OghamMark';

export type AppNavPlace = 'chats' | 'space' | 'call';

interface AppNavProps {
  place: AppNavPlace;
  inCall: boolean;
  /** True when Call can start (not already in a call). */
  canCall: boolean;
  onChats: () => void;
  onCall: () => void;
  onSettings: () => void;
}

/**
 * Permanent top fixture: brand · Chat · Call · Settings gear.
 * Inner row matches the chat column; bar edge can full-bleed.
 */
export function AppNav(props: AppNavProps) {
  return (
    <header
      data-testid="app-nav"
      className="shrink-0 border-b border-[color:var(--color-line)]/70 bg-[color:var(--color-panel)]/90 backdrop-blur-sm"
    >
      <div className="app-column app-gutter-x flex items-center gap-2 py-2 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <OghamMark className="h-6 w-auto shrink-0 text-[color:var(--color-gold)]" />
          <span className="truncate font-[family-name:var(--font-display)] text-lg tracking-tight">
            Ogma
          </span>
        </div>

        <nav aria-label="App" className="ml-1 flex items-center gap-1 sm:ml-2 sm:gap-1.5">
          <NavAction
            testId="nav-chats"
            label="Chat"
            /** Active only on the chooser — open thread is not the list. */
            ariaLabel={props.place === 'space' ? 'All chats' : 'Chat'}
            icon={<MessageSquare className="h-4 w-4" />}
            active={props.place === 'chats'}
            onClick={props.onChats}
          />
          <NavAction
            testId="nav-call"
            label="Call"
            icon={<Phone className="h-4 w-4" />}
            active={props.place === 'call' || props.inCall}
            emphasized={!props.inCall && props.canCall}
            onClick={props.onCall}
          />
        </nav>

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

function NavAction(props: {
  testId: string;
  label: string;
  ariaLabel?: string;
  icon: ReactNode;
  active: boolean;
  emphasized?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={props.testId}
      aria-label={props.ariaLabel ?? props.label}
      onClick={props.onClick}
      className={[
        'flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition sm:px-3',
        props.active
          ? 'bg-[color:var(--color-gold)] text-[color:var(--color-on-gold)]'
          : props.emphasized
            ? 'text-[color:var(--color-gold)] hover:bg-[color:var(--color-panel-2)]'
            : 'text-[color:var(--color-ink)] hover:bg-[color:var(--color-panel-2)]',
      ].join(' ')}
    >
      {props.icon}
      <span>{props.label}</span>
    </button>
  );
}
