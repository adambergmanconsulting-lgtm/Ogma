import { OghamMark } from './OghamMark';

interface LobbyProps {
  displayName: string;
  roomInput: string;
  mediaError: string | null;
  busy: boolean;
  inviteMode: boolean;
  onDisplayName: (v: string) => void;
  onRoomInput: (v: string) => void;
  onCreate: () => void;
  onJoin: () => void;
}

export function Lobby(props: LobbyProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center px-5 py-10 fade-up">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 font-[family-name:var(--font-display)] text-5xl tracking-tight text-[color:var(--color-ink)] md:text-6xl">
          <OghamMark className="h-10 w-auto shrink-0 text-[color:var(--color-gold)] md:h-12" />
          <span>Ogma</span>
        </h1>
        {props.inviteMode ? (
          <p className="mt-3 max-w-prose text-[color:var(--color-muted)]">
            You’ve been invited. Enter your name and tap Join this room — do not Create a new room or
            you’ll be alone.
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-sm text-[color:var(--color-muted)]">Your name</span>
          <input
            data-testid="display-name"
            value={props.displayName}
            onChange={(e) => props.onDisplayName(e.target.value)}
            placeholder="Ada"
            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-3 py-2.5 outline-none focus:border-[color:var(--color-gold)]"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-[color:var(--color-muted)]">Room link or id</span>
          <input
            data-testid="room-input"
            value={props.roomInput}
            onChange={(e) => props.onRoomInput(e.target.value)}
            placeholder="Paste a room link to join"
            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-3 py-2.5 outline-none focus:border-[color:var(--color-gold)]"
          />
        </label>
        {props.mediaError ? (
          <p className="text-sm text-[color:var(--color-danger)]">{props.mediaError}</p>
        ) : null}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          {props.inviteMode ? (
            <>
              <button
                type="button"
                data-testid="join-room"
                disabled={props.busy || !props.roomInput.trim()}
                onClick={props.onJoin}
                className="w-full rounded-xl bg-[color:var(--color-gold)] px-4 py-3 font-semibold text-[#1a1408] transition hover:brightness-105 disabled:opacity-60 sm:flex-1"
              >
                Join this room
              </button>
              <button
                type="button"
                data-testid="create-room"
                disabled={props.busy}
                onClick={props.onCreate}
                className="w-full px-2 py-2 text-sm text-[color:var(--color-muted)] underline-offset-2 hover:underline disabled:opacity-60 sm:w-auto"
              >
                Create a different room instead
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                data-testid="create-room"
                disabled={props.busy}
                onClick={props.onCreate}
                className="flex-1 rounded-xl bg-[color:var(--color-gold)] px-4 py-3 font-semibold text-[#1a1408] transition hover:brightness-105 disabled:opacity-60"
              >
                Create room
              </button>
              <button
                type="button"
                data-testid="join-room"
                disabled={props.busy || !props.roomInput.trim()}
                onClick={props.onJoin}
                className="flex-1 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-3 font-semibold transition hover:bg-[color:var(--color-panel-2)] disabled:opacity-60"
              >
                Join room
              </button>
            </>
          )}
        </div>
      </div>

      <details className="mt-8 max-w-prose text-sm text-[color:var(--color-muted)]">
        <summary className="cursor-pointer select-none text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]">
          About Ogma
        </summary>
        <div className="mt-3 space-y-3 text-xs leading-relaxed">
          <p>
            In Celtic myth, the god of speech and open dialogue — connecting speaker to listener with
            invisible golden threads. Peer-to-peer video and text in the browser.
          </p>
          <p>
            Video, audio, and live chat stay between peers. Ogma runs no media or chat server. Public
            trackers only help you meet; STUN may be used for connectivity. Anyone with the room link
            can join. Keep this tab open to stay in the call.
          </p>
        </div>
      </details>
    </div>
  );
}
