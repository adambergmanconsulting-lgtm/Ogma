import { Fingerprint } from 'lucide-react';
import { shortPersonId } from '../domain/loom/personKey';

/** Quiet mark for a known person id. The name stays the name. */
export function PersonIdMark(props: { id: string }) {
  const short = shortPersonId(props.id);
  return (
    <span className="group relative inline-flex items-center">
      <button
        type="button"
        data-testid="person-id"
        className="inline-flex shrink-0 items-center text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
        aria-label={`Person id ${short}`}
        title={props.id}
      >
        <Fingerprint className="h-2.5 w-2.5" aria-hidden />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden w-max max-w-[14rem] break-all rounded-md bg-[color:var(--color-panel-2)] px-2 py-1 font-mono text-[10px] leading-snug text-[color:var(--color-ink)] ring-1 ring-[color:var(--color-line)] group-hover:block group-focus-within:block"
      >
        {props.id}
      </span>
    </span>
  );
}
