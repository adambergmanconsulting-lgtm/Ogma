import { personIdForName } from '../domain/loom/personKey';
import { PersonIdMark } from './PersonIdMark';

/** A display name, with this vault's id beside it when the name is that person. */
export function PersonName(props: {
  /** Name used to decide whether this is the vault's person. */
  name: string;
  /** Visible text when a chip shortens the name. Defaults to `name`. */
  label?: string;
  selfName?: string;
  personId?: string | null;
  /** Show this id even when the name is not the local vault. */
  markId?: string | null;
  className?: string;
  truncate?: boolean;
}) {
  const id = props.markId ?? personIdForName(props.name, props.selfName ?? '', props.personId);
  return (
    <span
      className={['inline-flex min-w-0 items-center gap-1', props.className].filter(Boolean).join(' ')}
    >
      <span className={props.truncate ? 'min-w-0 truncate' : undefined}>{props.label ?? props.name}</span>
      {id ? <PersonIdMark id={id} /> : null}
    </span>
  );
}
