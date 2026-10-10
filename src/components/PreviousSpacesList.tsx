import { Phone } from 'lucide-react';
import {
  displaySpaceLabel,
  formatSpaceActivity,
  spaceActivityAt,
} from '../domain/loom/spaceIndex';
import type { SpaceIndexRow } from '../domain/loom/types';

export interface PreviousSpacesListProps {
  chats: SpaceIndexRow[];
  displayName: string;
  busy?: boolean;
  activeSpaceId?: string | null;
  error?: string | null;
  spaceInput: string;
  onSpaceInput: (value: string) => void;
  onJoinSpace: () => void;
  onOpenChat: (spaceId: string) => void;
  onOpenCall: (spaceId: string) => void;
}

/** Spaces tab: open a space by name, Call as the secondary act, quiet invite. */
export function PreviousSpacesList(props: PreviousSpacesListProps) {
  const joining = Boolean(props.spaceInput.trim());

  return (
    <div data-testid="previous-spaces" className="space-pane-pad py-2">
      {props.error ? <p className="text-danger mb-2 text-sm">{props.error}</p> : null}
      {props.chats.length === 0 ? (
        <p className="py-2 text-xs text-[color:var(--color-muted)]">No spaces yet.</p>
      ) : (
        <ul>
          {props.chats.map((row) => {
            const label = displaySpaceLabel(row, props.displayName);
            const activity = formatSpaceActivity(spaceActivityAt(row));
            const active = row.spaceId === props.activeSpaceId;
            return (
              <li
                key={row.spaceId}
                className={[
                  'flex items-baseline gap-2 py-1.5',
                  active ? 'text-[color:var(--color-gold)]' : '',
                ].join(' ')}
              >
                <button
                  type="button"
                  data-testid={`space-chat-${row.spaceId}`}
                  disabled={props.busy}
                  onClick={() => props.onOpenChat(row.spaceId)}
                  className="min-w-0 flex-1 truncate text-left text-[13px] font-medium hover:underline"
                  title={label}
                >
                  {label}
                </button>
                {activity ? (
                  <span
                    className="shrink-0 text-[10px] tabular-nums text-[color:var(--color-muted)]"
                    data-testid={`space-activity-${row.spaceId}`}
                  >
                    {activity}
                  </span>
                ) : null}
                {row.unreadCount > 0 ? (
                  <span
                    className="tabular-nums text-[10px] font-semibold text-[color:var(--color-gold)]"
                    data-testid={`unread-${row.spaceId}`}
                  >
                    {row.unreadCount}
                  </span>
                ) : null}
                <button
                  type="button"
                  data-testid={`space-call-${row.spaceId}`}
                  disabled={props.busy}
                  onClick={() => props.onOpenCall(row.spaceId)}
                  className="link-action shrink-0"
                  aria-label={`Call ${label}`}
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  Call
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <details className="mt-3" data-testid="home-join">
        <summary className="cursor-pointer select-none text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]">
          Have an invite?
        </summary>
        <div className="mt-2 flex gap-2">
          <input
            data-testid="space-input"
            value={props.spaceInput}
            onChange={(e) => props.onSpaceInput(e.target.value)}
            aria-label="Invite link"
            className="field field--compact"
          />
          <button
            type="button"
            data-testid="join-space"
            disabled={props.busy || !joining}
            onClick={props.onJoinSpace}
            className="btn-secondary btn-secondary--sm"
          >
            Join
          </button>
        </div>
      </details>
    </div>
  );
}
