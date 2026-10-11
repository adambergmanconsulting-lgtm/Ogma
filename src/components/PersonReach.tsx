export type PersonReach = {
  selfPersonId: string | null;
  appearActive: boolean;
  tabVisible: boolean;
  people: { personPublicB64: string; name: string; active: boolean }[];
  cardForName: (name: string) => { personPublicB64: string } | null;
  onToggleAppearActive: () => void;
  /** Open a new space with this person. */
  onInvite: (personPublicB64: string) => void;
  /** Bring this person into the open space. Absent until a space is open. */
  onInviteHere?: (personPublicB64: string) => void;
};

/** Reachable status for this person. A quiet dot, not a Start new action. */
export function AppearActive(props: { active: boolean; onToggle: () => void; testId?: string }) {
  return (
    <button
      type="button"
      data-testid={props.testId ?? 'appear-active'}
      aria-pressed={props.active}
      onClick={props.onToggle}
      className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[color:var(--color-muted)] opacity-80 hover:opacity-100"
    >
      <span
        aria-hidden
        className={[
          'h-1.5 w-1.5 rounded-full',
          props.active ? 'bg-[color:var(--color-ok)]' : 'bg-[color:var(--color-line)]',
        ].join(' ')}
      />
      {props.active ? 'Active' : 'Hidden'}
    </button>
  );
}

/** Someone else can take a space while their app is open. */
export function PersonInvite(props: { active: boolean; onInvite: () => void; title?: string }) {
  return (
    <button
      type="button"
      data-testid="person-invite"
      disabled={!props.active}
      onClick={props.onInvite}
      className="link-action shrink-0 text-xs disabled:opacity-40"
      title={props.title ?? (props.active ? 'Invite to a new chat' : 'Not active')}
    >
      Invite
    </button>
  );
}
