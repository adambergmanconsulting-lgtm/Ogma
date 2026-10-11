import type { ReactNode } from 'react';
import { ChatColumn, type ChatPane } from './ChatColumn';
import { VideoIdle } from './VideoIdle';

interface WorkspaceIdleProps {
  chatPane: ChatPane;
  onChatPane: (pane: ChatPane) => void;
  spacesPane: ReactNode;
}

/** Empty Video | Chat when no space is open. */
export function WorkspaceIdle(props: WorkspaceIdleProps) {
  return (
    <div data-testid="space-view" className="relative flex h-full min-h-0 flex-col">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <VideoIdle />
      </div>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          data-testid="space-presence"
          className="relative z-10 flex min-h-[11rem] shrink-0 flex-col border-b border-[color:var(--color-line)]/50 bg-[color:var(--color-panel)]/25 md:min-h-0 md:flex-1 md:border-b-0 md:border-r"
        >
          <header className="space-pane-head">
            <span
              data-testid="space-mode-label"
              role="status"
              className="min-w-0 flex-1 truncate text-xs text-[color:var(--color-muted)]"
            >
              Video off
            </span>
          </header>
          <div className="min-h-0 flex-1" />
        </aside>

        <ChatColumn
          pane={props.chatPane}
          onPane={props.onChatPane}
          className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col bg-[color:var(--color-panel)]/25 md:w-[min(22rem,38%)] md:max-w-sm md:flex-none"
          spaces={props.spacesPane}
        >
          <header className="space-pane-pad shrink-0 border-b border-[color:var(--color-line)]/50 py-2">
            <h1 className="truncate text-base font-semibold tracking-tight text-[color:var(--color-muted)]">
              No space open
            </h1>
          </header>
          <div className="space-pane-pad min-h-0 flex-1 py-2">
            <p className="pt-3 text-center text-xs leading-relaxed text-[color:var(--color-muted)]">
              Start a new chat from the top bar, or open Spaces.
            </p>
          </div>
        </ChatColumn>
      </div>
    </div>
  );
}
