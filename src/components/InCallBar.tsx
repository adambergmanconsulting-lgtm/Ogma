import { Phone, PhoneOff } from 'lucide-react';

interface InCallBarProps {
  statusLabel: string;
  onReturn: () => void;
  onLeave: () => void;
}

/** Soft-nav return strip while Thread stays live in the background. */
export function InCallBar(props: InCallBarProps) {
  return (
    <div
      data-testid="in-call-bar"
      className="app-gutter-x flex shrink-0 items-center gap-3 border-t border-[color:var(--color-line)]/70 bg-[color:var(--color-panel)]/95 py-2.5 backdrop-blur-sm"
      role="status"
    >
      <span className="inline-flex min-w-0 flex-1 items-center gap-2 text-sm">
        <Phone className="h-4 w-4 shrink-0 text-[color:var(--color-gold)]" aria-hidden />
        <span className="truncate font-medium">{props.statusLabel}</span>
      </span>
      <button
        type="button"
        data-testid="in-call-return"
        onClick={props.onReturn}
        className="btn-primary btn-primary--sm shrink-0"
      >
        Back to call
      </button>
      <button
        type="button"
        data-testid="in-call-leave"
        onClick={props.onLeave}
        aria-label="Leave call"
        title="Leave call"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-danger)] text-white transition hover:brightness-110"
      >
        <PhoneOff className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
