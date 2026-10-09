import { displaySpaceLabel } from '../domain/loom/spaceIndex';
import type { SpaceIndexRow } from '../domain/loom/types';

interface ChatsHomeProps {
  recent: SpaceIndexRow[];
  archived: SpaceIndexRow[];
  displayName: string;
  spaceInput: string;
  busy: boolean;
  error: string | null;
  onSpaceInput: (v: string) => void;
  onCreateSpace: () => void;
  onJoinSpace: () => void;
  onOpenSpace: (spaceId: string) => void;
  onArchive: (spaceId: string) => void;
  onUnarchive: (spaceId: string) => void;
}

function SpaceRow(props: {
  row: SpaceIndexRow;
  displayName: string;
  onOpen: () => void;
  archiveLabel: string;
  onArchiveToggle: () => void;
}) {
  return (
    <li className="group flex items-baseline gap-3 border-b border-[color:var(--color-line)]/60 py-3 last:border-0">
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={props.onOpen}
        data-testid={`space-row-${props.row.spaceId}`}
      >
        <span className="block truncate text-[15px] font-medium">
          {displaySpaceLabel(props.row, props.displayName)}
        </span>
      </button>
      {props.row.unreadCount > 0 ? (
        <span
          className="tabular-nums text-xs font-semibold text-[color:var(--color-gold)]"
          data-testid={`unread-${props.row.spaceId}`}
        >
          {props.row.unreadCount}
        </span>
      ) : null}
      <button
        type="button"
        className="shrink-0 text-xs text-[color:var(--color-muted)] opacity-0 transition group-hover:opacity-100 focus:opacity-100"
        onClick={props.onArchiveToggle}
      >
        {props.archiveLabel}
      </button>
    </li>
  );
}

export function ChatsHome(props: ChatsHomeProps) {
  const empty = props.recent.length === 0 && props.archived.length === 0;
  const joining = Boolean(props.spaceInput.trim());

  return (
    <div className="app-column app-gutter-x flex h-full min-h-0 flex-col py-8 fade-up">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Chat</h1>
      </header>

      <div className="mb-6 flex gap-2">
        <input
          data-testid="space-input"
          value={props.spaceInput}
          onChange={(e) => props.onSpaceInput(e.target.value)}
          aria-label="Invite link"
          className="min-w-0 flex-1 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)]/80 px-3 py-2.5 outline-none focus:border-[color:var(--color-gold)]"
        />
        <button
          type="button"
          data-testid={joining ? 'join-space' : 'create-space'}
          disabled={props.busy}
          onClick={joining ? props.onJoinSpace : props.onCreateSpace}
          className="rounded-xl bg-[color:var(--color-gold)] px-4 py-2.5 font-semibold text-[color:var(--color-on-gold)] disabled:opacity-60"
        >
          {joining ? 'Join' : 'Create'}
        </button>
      </div>

      {props.error ? <p className="mb-4 text-sm text-[color:var(--color-danger)]">{props.error}</p> : null}

      <section className="min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <p className="text-sm text-[color:var(--color-muted)]">
            Create a chat, or Call to start with video — or paste an invite
          </p>
        ) : (
          <ul>
            {props.recent.map((row) => (
              <SpaceRow
                key={row.spaceId}
                row={row}
                displayName={props.displayName}
                onOpen={() => props.onOpenSpace(row.spaceId)}
                onArchiveToggle={() => props.onArchive(row.spaceId)}
                archiveLabel="Hide"
              />
            ))}
          </ul>
        )}
      </section>

      {props.archived.length > 0 ? (
        <details className="mt-6">
          <summary className="cursor-pointer select-none text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]">
            Hidden ({props.archived.length})
          </summary>
          <ul className="mt-2">
            {props.archived.map((row) => (
              <SpaceRow
                key={row.spaceId}
                row={row}
                displayName={props.displayName}
                onOpen={() => props.onOpenSpace(row.spaceId)}
                onArchiveToggle={() => props.onUnarchive(row.spaceId)}
                archiveLabel="Show"
              />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
