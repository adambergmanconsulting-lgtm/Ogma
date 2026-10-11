import { Check, ChevronDown, Copy } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { ShareResult } from '../domain/signaling/share';
import { PersonName } from './PersonName';
import { PersonInvite, type PersonReach } from './PersonReach';

type Flash = 'idle' | 'ok' | 'fail';

/**
 * This chat invite: one quiet row of actions; people open in a vertical panel.
 * Full directory / start-chat lives on All → People.
 */
export function ChatInvite(props: {
  inviteUrl: string | null;
  onCopyInvite: () => Promise<ShareResult>;
  reach?: PersonReach | null;
}) {
  const inviteHere = props.reach?.onInviteHere;
  const canLink = Boolean(props.inviteUrl);
  const showPerson = Boolean(props.reach?.selfPersonId && inviteHere);
  const people = showPerson ? (props.reach?.people ?? []) : [];
  const activePeople = people.filter((p) => p.active);
  const activeCount = activePeople.length;
  const personIdle = activeCount === 0;

  const [flash, setFlash] = useState<Flash>('idle');
  const [bump, setBump] = useState(0);
  const [personOpen, setPersonOpen] = useState(false);
  const clearTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    return () => {
      if (clearTimer.current) window.clearTimeout(clearTimer.current);
    };
  }, []);

  useEffect(() => {
    if (flash === 'fail') inputRef.current?.select();
  }, [flash]);

  useEffect(() => {
    if (personIdle) setPersonOpen(false);
  }, [personIdle]);

  useEffect(() => {
    if (!personOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setPersonOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPersonOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [personOpen]);

  if (!canLink && !showPerson) return null;

  const scheduleClear = () => {
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    clearTimer.current = window.setTimeout(() => setFlash('idle'), 2200);
  };

  const onCopy = async () => {
    const result = await props.onCopyInvite();
    if (result.ok) {
      setFlash('ok');
      setBump((n) => n + 1);
      scheduleClear();
      return;
    }
    if (result.reason === 'cancelled') {
      setFlash('idle');
      return;
    }
    setFlash('fail');
    scheduleClear();
  };

  const ok = flash === 'ok';
  const fail = flash === 'fail';

  return (
    <div ref={rootRef} data-testid="chat-invite" className="relative flex flex-col gap-2">
      {fail && props.inviteUrl ? (
        <input
          ref={inputRef}
          data-testid="invite-url"
          readOnly
          value={props.inviteUrl}
          aria-label="Invite link"
          onFocus={(e) => e.currentTarget.select()}
          className="field field--compact w-full font-mono text-[11px]"
        />
      ) : null}

      <div className="flex min-w-0 items-center justify-between gap-3">
        {showPerson ? (
          <button
            type="button"
            data-testid="chat-invite-person"
            className="link-action min-w-0"
            disabled={personIdle}
            title={personIdle ? 'No one is Active' : undefined}
            aria-expanded={personIdle ? undefined : personOpen}
            aria-controls={personIdle ? undefined : panelId}
            onClick={() => {
              if (personIdle) return;
              setPersonOpen((value) => !value);
            }}
          >
            <span className="truncate">
              Invite
              <span className="text-[color:var(--color-muted)]">
                {' '}
                · {activeCount} Active
              </span>
            </span>
            {!personIdle ? (
              <ChevronDown
                className={[
                  'h-3.5 w-3.5 shrink-0 transition',
                  personOpen ? 'rotate-180' : '',
                ].join(' ')}
                aria-hidden
              />
            ) : null}
          </button>
        ) : (
          <span />
        )}

        {canLink && props.inviteUrl ? (
          <div
            data-testid="invite-link-bar"
            data-flash={flash}
            data-bump={bump}
            className="shrink-0"
          >
            <button
              type="button"
              data-testid="share-link"
              onClick={() => void onCopy()}
              className="link-action shrink-0"
              style={
                ok
                  ? { color: 'var(--color-ok)' }
                  : fail
                    ? { color: 'var(--color-danger)' }
                    : undefined
              }
            >
              {ok ? (
                <>
                  <Check key={bump} className="h-3.5 w-3.5" aria-hidden />
                  Copied
                </>
              ) : fail ? (
                'Select & copy'
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  Copy link
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>

      {showPerson && personOpen && !personIdle ? (
        <div
          id={panelId}
          data-testid="chat-invite-panel"
          className="rounded-lg border border-[color:var(--color-line)]/60 bg-[color:var(--color-panel)] p-2 shadow-sm"
        >
          <ul
            data-testid="chat-invite-list"
            className="max-h-52 space-y-1 overflow-y-auto"
          >
            {activePeople.map((person) => (
              <li
                key={person.personPublicB64}
                className="flex items-center gap-2 px-1 py-1"
              >
                <PersonName
                  name={person.name}
                  selfName=""
                  markId={person.personPublicB64}
                  className="min-w-0 flex-1 truncate text-sm"
                />
                <PersonInvite
                  active
                  title="Invite into this chat"
                  onInvite={() => {
                    inviteHere?.(person.personPublicB64);
                    setPersonOpen(false);
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
