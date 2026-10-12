import type { ReactNode } from 'react';
import { useIdleWashResting } from '../hooks/useIdleWashResting';
import { ChatColumn, type ChatPane } from './ChatColumn';
import { PaneMark } from './SpacePaneChrome';
import { VideoIdle } from './VideoIdle';

interface WorkspaceIdleProps {
  chatPane: ChatPane;
  onChatPane: (pane: ChatPane) => void;
  spacesPane: ReactNode;
  chatTitle?: string;
  startNew?: { busy?: boolean; disabled?: boolean; onNewChat: () => void };
  startJoin?: { busy?: boolean; onJoin: () => void };
}

/** Empty Video | Chat when no space is open. */
export function WorkspaceIdle(props: WorkspaceIdleProps) {
  const washResting = useIdleWashResting({ hold: false, tick: 0 });

  return (
    <div data-testid="space-view" className="relative flex h-full min-h-0 flex-col">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <VideoIdle resting={washResting} />
      </div>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          data-testid="space-presence"
          className="relative flex min-h-[7.5rem] shrink-0 flex-col border-b border-[color:var(--color-line)]/50 bg-[color:var(--color-panel)]/25 md:min-h-0 md:flex-1 md:border-b-0 md:border-r"
        >
          <header className="space-pane-head">
            <PaneMark kind="video" />
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
          className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[color:var(--color-panel)]/25 md:w-[min(22rem,38%)] md:max-w-sm md:flex-none"
          spaces={props.spacesPane}
          chatTitle={props.chatTitle}
          startNew={props.startNew}
          startJoin={props.startJoin}
        >
          <header className="space-pane-pad shrink-0 border-b border-[color:var(--color-line)]/50 py-2">
            <h1 className="truncate text-base font-semibold tracking-tight text-[color:var(--color-muted)]">
              No space open
            </h1>
          </header>
          <div className="space-pane-pad min-h-0 flex-1 py-2">
            <p className="pt-3 text-center text-xs leading-relaxed text-[color:var(--color-muted)]">
              New or Join above, or open a chat from All.
            </p>
          </div>
        </ChatColumn>
      </div>
    </div>
  );
}
