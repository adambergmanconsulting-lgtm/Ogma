import { Link2 } from 'lucide-react';

/** Open All and focus invite paste — peer of New in the chat head. */
export function StartJoin(props: {
  busy?: boolean;
  onJoin: () => void;
}) {
  return (
    <button
      type="button"
      data-testid="home-join-open"
      disabled={props.busy}
      onClick={props.onJoin}
      className="link-action shrink-0"
      aria-label="Join with invite"
    >
      <Link2 className="h-3.5 w-3.5" aria-hidden />
      Join
    </button>
  );
}
