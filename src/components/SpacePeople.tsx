import { shortDisplayName } from '../domain/loom/spaceIndex';
import { PersonName } from './PersonName';
import { PersonInvite, type PersonReach } from './PersonReach';

/** People on a call. Invite sits beside someone who is Active. */
export function SpacePeople(props: {
  people: string[];
  selfName: string;
  personId?: string | null;
  reach?: PersonReach | null;
}) {
  if (props.people.length === 0) return null;
  return (
    <ul
      data-testid="space-people"
      className="flex flex-wrap gap-x-2 gap-y-1"
      aria-label="People in this call"
    >
      {props.people.map((full) => {
        const short = shortDisplayName(full) || full;
        const card = props.reach?.cardForName(full) ?? null;
        const self = full.trim().toLowerCase() === props.selfName.trim().toLowerCase();
        const known = card
          ? props.reach?.people.find((p) => p.personPublicB64 === card.personPublicB64)
          : null;
        return (
          <li key={full.toLowerCase()} title={full} className="inline-flex items-center gap-1">
            <PersonName
              name={full}
              label={short}
              selfName={props.selfName}
              personId={props.personId}
              markId={card?.personPublicB64}
              className="text-xs text-[color:var(--color-muted)]"
            />
            {!self && card && known?.active ? (
              <>
                <span className="text-[10px] text-[color:var(--color-muted)]">Active</span>
                <PersonInvite
                  active
                  title={props.reach?.onInviteHere ? 'Invite into this chat' : 'Invite to a new chat'}
                  onInvite={() =>
                    (props.reach?.onInviteHere ?? props.reach?.onInvite)?.(card.personPublicB64)
                  }
                />
              </>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
