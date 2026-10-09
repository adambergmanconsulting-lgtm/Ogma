import { THREAD_FREE_HONEST_COPY } from '../domain/thread/honestCopy';

interface LobbyProps {
  displayName: string;
  mediaError: string | null;
  busy: boolean;
  canJoin: boolean;
  onJoin: () => void;
}

/**
 * Invite-only Call entry: opened from a shared #room= link.
 * Creating a call is Call on a chat — not a separate lobby place.
 */
export function Lobby(props: LobbyProps) {
  return (
    <div className="app-gutter-x mx-auto flex min-h-full w-full max-w-sm flex-col justify-center py-10 fade-up">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Call</h1>
      <p className="mb-2 text-sm text-[color:var(--color-muted)]">{props.displayName}</p>
      <p
        data-testid="thread-honest-copy"
        className="mb-8 text-sm leading-relaxed text-[color:var(--color-muted)]"
      >
        {THREAD_FREE_HONEST_COPY}
      </p>

      {props.mediaError ? (
        <p className="mb-4 text-sm text-[color:var(--color-danger)]">{props.mediaError}</p>
      ) : null}

      <button
        type="button"
        data-testid="join-room"
        disabled={props.busy || !props.canJoin}
        onClick={props.onJoin}
        className="w-full rounded-xl bg-[color:var(--color-gold)] px-4 py-3 font-semibold text-[color:var(--color-on-gold)] transition hover:bg-[color:var(--color-honey)] disabled:opacity-60"
      >
        Join
      </button>
    </div>
  );
}
