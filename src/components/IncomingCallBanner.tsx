import { Phone } from 'lucide-react';
import { PersonName } from './PersonName';

interface IncomingCallBannerProps {
  author: string;
  selfName: string;
  personId?: string | null;
  busy?: boolean;
  error?: string | null;
  onAccept: () => void;
  onDismiss: () => void;
}

/** Moment: peer started Call — Accept or Not now. */
export function IncomingCallBanner(props: IncomingCallBannerProps) {
  return (
    <div
      role="dialog"
      aria-label="Incoming call"
      data-testid="incoming-call"
      className="space-pane-pad shrink-0 border-b border-[color:var(--color-line)]/60 bg-[color:var(--color-panel-2)]/80 py-2.5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 text-sm text-[color:var(--color-ink)]">
          <PersonName
            name={props.author}
            selfName={props.selfName}
            personId={props.personId}
          />{' '}
          started a call
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            data-testid="incoming-call-dismiss"
            disabled={props.busy}
            onClick={props.onDismiss}
            className="btn-quiet"
          >
            Not now
          </button>
          <button
            type="button"
            data-testid="incoming-call-accept"
            disabled={props.busy}
            onClick={props.onAccept}
            className="btn-primary btn-primary--sm inline-flex items-center gap-1"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            {props.busy ? 'Joining…' : 'Accept'}
          </button>
        </div>
      </div>
      {props.error ? (
        <p
          data-testid="incoming-call-error"
          className="mt-2 text-sm text-[color:var(--color-danger)]"
        >
          {props.error}
        </p>
      ) : null}
    </div>
  );
}
