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
    <div className="app-gutter-x gate-shell fade-up">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Call</h1>
      <p className="text-muted mb-2">{props.displayName}</p>
      <p data-testid="thread-honest-copy" className="text-muted mb-8 leading-relaxed">
        {THREAD_FREE_HONEST_COPY}
      </p>

      {props.mediaError ? <p className="text-danger mb-4">{props.mediaError}</p> : null}

      <button
        type="button"
        data-testid="join-room"
        disabled={props.busy || !props.canJoin}
        onClick={props.onJoin}
        className="btn-primary w-full"
      >
        Join
      </button>
    </div>
  );
}
