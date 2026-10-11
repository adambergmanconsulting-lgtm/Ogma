import type { ReactNode } from 'react';
import { FoldButton } from './SpacePaneChrome';
import { StartNew } from './StartNew';

export type ChatPane = 'chat' | 'spaces';

interface ChatColumnProps {
  pane: ChatPane;
  onPane: (pane: ChatPane) => void;
  className: string;
  onFold?: () => void;
  foldDisabled?: boolean;
  spaces: ReactNode;
  /** Create a new chat space. Absent when create is unavailable. */
  startNew?: { busy?: boolean; disabled?: boolean; onNewChat: () => void };
  children: ReactNode;
}

/** Chat column: one tab visible — this chat, or all chats. */
export function ChatColumn(props: ChatColumnProps) {
  return (
    <section data-testid="space-chat" className={props.className}>
      <div
        role="tablist"
        aria-label="Chat column"
        className="space-pane-head"
      >
        <Tab
          testId="chat-pane-chat"
          selected={props.pane === 'chat'}
          onClick={() => props.onPane('chat')}
        >
          This chat
        </Tab>
        <Tab
          testId="chat-pane-spaces"
          selected={props.pane === 'spaces'}
          onClick={() => props.onPane('spaces')}
        >
          All
        </Tab>
        <div className="min-w-0 flex-1" />
        {props.startNew ? (
          <StartNew
            busy={props.startNew.busy}
            disabled={props.startNew.disabled}
            onNewChat={props.startNew.onNewChat}
          />
        ) : null}
        {props.onFold ? (
          <FoldButton
            testId="space-fold-chat"
            label="Hide chat"
            edge="end"
            disabled={props.foldDisabled}
            onClick={props.onFold}
          />
        ) : null}
      </div>
      {props.pane === 'spaces' ? (
        <div className="min-h-0 flex-1 overflow-y-auto">{props.spaces}</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">{props.children}</div>
      )}
    </section>
  );
}

function Tab(props: {
  testId: string;
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      data-testid={props.testId}
      aria-selected={props.selected}
      onClick={props.onClick}
      className={[
        'rounded-lg px-2.5 py-1 text-sm font-semibold',
        props.selected
          ? 'bg-[color:var(--color-panel-2)] text-[color:var(--color-ink)]'
          : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]',
      ].join(' ')}
    >
      {props.children}
    </button>
  );
}
