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
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-5 py-10 fade-up">
      <h1 className="mb-8 flex items-center gap-3 font-[family-name:var(--font-display)] text-5xl tracking-tight text-[color:var(--color-ink)] md:text-6xl">
        <OghamMark className="h-10 w-auto shrink-0 text-[color:var(--color-gold)] md:h-12" />
        <span>Ogma</span>
      </h1>

      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-sm text-[color:var(--color-muted)]">Your name</span>
          <input
            data-testid="display-name"
            value={props.displayName}
            onChange={(e) => props.onDisplayName(e.target.value)}
            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-3 py-2.5 outline-none focus:border-[color:var(--color-gold)]"
          />
        </label>
        {!props.inviteMode ? (
          <label className="block space-y-1.5">
            <span className="text-sm text-[color:var(--color-muted)]">Invite link</span>
            <input
              data-testid="room-input"
              value={props.roomInput}
              onChange={(e) => props.onRoomInput(e.target.value)}
              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-3 py-2.5 outline-none focus:border-[color:var(--color-gold)]"
            />
          </label>
        ) : (
          <input data-testid="room-input" type="hidden" value={props.roomInput} readOnly />
        )}
        {props.mediaError ? (
          <p className="text-sm text-[color:var(--color-danger)]">{props.mediaError}</p>
        ) : null}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
          {props.inviteMode ? (
            <>
              <button
                type="button"
                data-testid="join-room"
                disabled={props.busy || !props.roomInput.trim()}
                onClick={props.onJoin}
                className="w-full rounded-xl bg-[color:var(--color-gold)] px-4 py-3 font-semibold text-[color:var(--color-on-gold)] transition hover:bg-[color:var(--color-honey)] disabled:opacity-60 sm:flex-1"
              >
                Join
              </button>
              <button
                type="button"
                data-testid="create-room"
                disabled={props.busy}
                onClick={props.onCreate}
                className="w-full px-2 py-2 text-sm text-[color:var(--color-muted)] underline-offset-2 hover:underline disabled:opacity-60 sm:w-auto"
              >
                New room
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                data-testid="create-room"
                disabled={props.busy}
                onClick={props.onCreate}
                className="flex-1 rounded-xl bg-[color:var(--color-gold)] px-4 py-3 font-semibold text-[color:var(--color-on-gold)] transition hover:bg-[color:var(--color-honey)] disabled:opacity-60"
              >
                Create
              </button>
              <button
                type="button"
                data-testid="join-room"
                disabled={props.busy || !props.roomInput.trim()}
                onClick={props.onJoin}
                className="flex-1 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-3 font-semibold transition hover:bg-[color:var(--color-panel-2)] disabled:opacity-60"
              >
                Join
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
