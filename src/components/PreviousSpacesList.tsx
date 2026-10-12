import { useEffect, useRef, useState } from 'react';
import { Phone } from 'lucide-react';
import {
  displaySpaceLabel,
  formatSpaceActivity,
  spaceActivityAt,
  spaceMatchesQuery,
} from '../domain/loom/spaceIndex';
import type { SpaceIndexRow } from '../domain/loom/types';
import { PersonName } from './PersonName';
import { PersonInvite, type PersonReach } from './PersonReach';

export interface PreviousSpacesListProps {
  chats: SpaceIndexRow[];
  displayName: string;
  busy?: boolean;
  activeSpaceId?: string | null;
  error?: string | null;
  spaceInput: string;
  onSpaceInput: (value: string) => void;
  onJoinSpace: () => void;
  /** Bumps when chat-head Join should focus the paste field. */
  joinFocusNonce?: number;
  onOpenChat: (spaceId: string) => void;
  onOpenCall: (spaceId: string) => void;
  reach?: PersonReach | null;
}

/** All tab: invite paste, search, open a chat, Call as the secondary act. */
export function PreviousSpacesList(props: PreviousSpacesListProps) {
  const [query, setQuery] = useState('');
  const joinInputRef = useRef<HTMLInputElement>(null);
  const joining = Boolean(props.spaceInput.trim());
  const q = query.trim().toLowerCase();
  const chats = props.chats.filter((row) =>
    spaceMatchesQuery(row, query, props.displayName),
  );
  const people = (props.reach?.people ?? []).filter(
    (person) => !q || person.name.toLowerCase().includes(q),
  );

  useEffect(() => {
    if (!props.joinFocusNonce) return;
    joinInputRef.current?.focus();
  }, [props.joinFocusNonce]);

  const submitJoin = () => {
    if (props.busy || !joining) return;
    props.onJoinSpace();
  };

  return (
    <div data-testid="previous-spaces" className="space-pane-pad py-2">
      {props.error ? <p className="text-danger mb-2 text-sm">{props.error}</p> : null}

      <div data-testid="home-join" className="mb-3 flex gap-2">
        <input
          ref={joinInputRef}
          data-testid="space-input"
          value={props.spaceInput}
          onChange={(e) => props.onSpaceInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submitJoin();
            }
          }}
          aria-label="Invite link"
          placeholder="Invite link"
          className="field field--compact"
        />
        <button
          type="button"
          data-testid="join-space"
          disabled={props.busy || !joining}
          onClick={submitJoin}
          className="btn-secondary btn-secondary--sm"
        >
          Join
        </button>
      </div>

      {props.chats.length > 0 || (props.reach?.people.length ?? 0) > 0 ? (
        <input
          data-testid="spaces-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search chats and people"
          placeholder="Search"
          className="field field--compact mb-2 w-full"
        />
      ) : null}

      {props.chats.length === 0 ? (
        <p className="py-2 text-xs text-[color:var(--color-muted)]">No spaces yet.</p>
      ) : chats.length === 0 ? (
        <p className="py-2 text-xs text-[color:var(--color-muted)]">No matching chats.</p>
      ) : (
        <ul>
          {chats.map((row) => {
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

      {props.reach && (props.reach.people.length > 0 || props.reach.selfPersonId) ? (
        <section className="mt-5" data-testid="known-people">
          <h3 className="text-sm font-semibold tracking-tight text-[color:var(--color-ink)]">
            People
          </h3>
          <p className="mt-0.5 mb-2 text-[11px] leading-snug text-[color:var(--color-muted)]">
            Invite starts a new chat while they are Active.
          </p>
          {people.length === 0 ? (
            <p className="py-1 text-xs text-[color:var(--color-muted)]">No matching people.</p>
          ) : (
            <ul className="space-y-1">
              {people.map((person) => (
                <li
                  key={person.personPublicB64}
                  className="flex items-center gap-2 py-1"
                >
                  <PersonName
                    name={person.name}
                    selfName=""
                    markId={person.personPublicB64}
                    className="min-w-0 flex-1 text-[13px]"
                  />
                  {person.active ? (
                    <>
                      <span className="text-[10px] text-[color:var(--color-muted)]">Active</span>
                      <PersonInvite
                        active
                        title="Invite to a new chat"
                        onInvite={() => props.reach?.onInvite(person.personPublicB64)}
                      />
                    </>
                  ) : (
                    <span className="shrink-0 text-[10px] text-[color:var(--color-muted)]">
                      Hidden
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
