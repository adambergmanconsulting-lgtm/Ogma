interface LobbyProps {
  displayName: string;
  roomInput: string;
  mediaError: string | null;
  busy: boolean;
  onDisplayName: (v: string) => void;
  onRoomInput: (v: string) => void;
  onCreate: () => void;
  onJoin: () => void;
}

export function Lobby(props: LobbyProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center px-5 py-10 fade-up">
      <div className="mb-8">
        <svg viewBox="0 0 280 48" className="mb-5 h-10 w-auto text-[color:var(--color-gold)]" aria-hidden>
          <path
            className="thread-line"
            d="M8 28 C70 8, 210 8, 272 28"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="28" r="4" fill="currentColor" className="pulse-soft" />
          <circle cx="272" cy="28" r="4" fill="currentColor" className="pulse-soft" />
        </svg>
        <h1 className="font-[family-name:var(--font-display)] text-5xl tracking-tight text-[color:var(--color-ink)] md:text-6xl">
          Ogma
        </h1>
        <p className="mt-3 max-w-prose text-[color:var(--color-muted)]">
          In Celtic myth, the god of speech and open dialogue — connecting speaker to listener with
          invisible golden threads. Peer-to-peer video and text in the browser.
        </p>
        <p className="mt-3 max-w-prose text-xs leading-relaxed text-[color:var(--color-muted)]">
          Video, audio, and live chat stay between peers. Ogma runs no media or chat server. Public
          trackers only help you meet; STUN may be used for connectivity. Anyone with the room link
          can join. Keep this tab open to stay in the call.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-sm text-[color:var(--color-muted)]">Your name</span>
          <input
            value={props.displayName}
            onChange={(e) => props.onDisplayName(e.target.value)}
            placeholder="Ada"
            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-3 py-2.5 outline-none focus:border-[color:var(--color-gold)]"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-[color:var(--color-muted)]">Room link or id</span>
          <input
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
          <button
            type="button"
            disabled={props.busy}
            onClick={props.onCreate}
            className="flex-1 rounded-xl bg-[color:var(--color-gold)] px-4 py-3 font-semibold text-[#1a1408] transition hover:brightness-105 disabled:opacity-60"
          >
            Create room
          </button>
          <button
            type="button"
            disabled={props.busy || !props.roomInput.trim()}
            onClick={props.onJoin}
            className="flex-1 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-3 font-semibold transition hover:bg-[color:var(--color-panel-2)] disabled:opacity-60"
          >
            Join room
          </button>
        </div>
      </div>
    </div>
  );
}
