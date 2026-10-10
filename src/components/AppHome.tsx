import { MessageSquare, Phone } from 'lucide-react';
import {
  displaySpaceLabel,
  formatSpaceActivity,
  spaceActivityAt,
} from '../domain/loom/spaceIndex';
import type { SpaceIndexRow } from '../domain/loom/types';
import type { HomeAnchorKind, InstallOfferMode } from '../domain/shell/pwaInstall';
import { HomeAnchorCard } from './HomeAnchorCard';

interface AppHomeProps {
  chats: SpaceIndexRow[];
  displayName: string;
  spaceInput: string;
  busy: boolean;
  error: string | null;
  homeAnchor: HomeAnchorKind;
  installMode: InstallOfferMode;
  installHowOpen: boolean;
  onInstall: () => void;
  onDismissInstall: () => void;
  onVaultNudge: () => void;
  onDismissVaultNudge: () => void;
  onSpaceInput: (v: string) => void;
  onStartChat: () => void;
  onStartCall: () => void;
  onJoinSpace: () => void;
  onOpenChat: (spaceId: string) => void;
  onOpenCall: (spaceId: string) => void;
}

function ModeLinks(props: {
  chatTestId: string;
  callTestId: string;
  busy?: boolean;
  onChat: () => void;
  onCall: () => void;
}) {
  return (
    <>
      <button
        type="button"
        data-testid={props.chatTestId}
        disabled={props.busy}
        onClick={props.onChat}
        className="link-action"
      >
        <MessageSquare className="h-3.5 w-3.5" aria-hidden />
        Chat
      </button>
      <button
        type="button"
        data-testid={props.callTestId}
        disabled={props.busy}
        onClick={props.onCall}
        className="link-action"
      >
        <Phone className="h-3.5 w-3.5" aria-hidden />
        Call
      </button>
    </>
  );
}

function SpaceRow(props: {
  row: SpaceIndexRow;
  displayName: string;
  onChat: () => void;
  onCall: () => void;
}) {
  const label = displaySpaceLabel(props.row, props.displayName);
  const activity = formatSpaceActivity(spaceActivityAt(props.row));
  return (
    <li className="flex items-baseline gap-3 py-2.5">
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{label}</span>
      {activity ? (
        <span
          className="shrink-0 text-xs tabular-nums text-[color:var(--color-muted)]"
          data-testid={`space-activity-${props.row.spaceId}`}
        >
          {activity}
        </span>
      ) : null}
      {props.row.unreadCount > 0 ? (
        <span
          className="tabular-nums text-xs font-semibold text-[color:var(--color-gold)]"
          data-testid={`unread-${props.row.spaceId}`}
        >
          {props.row.unreadCount}
        </span>
      ) : null}
      <ModeLinks
        chatTestId={`space-chat-${props.row.spaceId}`}
        callTestId={`space-call-${props.row.spaceId}`}
        onChat={props.onChat}
        onCall={props.onCall}
      />
    </li>
  );
}

/** Home: Start new, then Previous spaces by activity. */
export function AppHome(props: AppHomeProps) {
  const joining = Boolean(props.spaceInput.trim());
  const hasPrevious = props.chats.length > 0;

  return (
    <div
      data-testid="app-home"
      className="app-column app-gutter-x flex h-full min-h-0 flex-col py-8 fade-up"
    >
      {props.error ? <p className="text-danger mb-4">{props.error}</p> : null}

      <HomeAnchorCard
        kind={props.homeAnchor}
        installMode={props.installMode}
        howOpen={props.installHowOpen}
        onInstall={props.onInstall}
        onDismissInstall={props.onDismissInstall}
        onVault={props.onVaultNudge}
        onDismissVault={props.onDismissVaultNudge}
      />

      <section className="flex-1">
        <ul>
          <li
            data-testid="home-start-new"
            className="flex items-baseline gap-3 border-b border-[color:var(--color-line)]/60 py-3 pb-4"
          >
            <span className="min-w-0 flex-1 truncate text-[15px] font-medium">Start new</span>
            <ModeLinks
              chatTestId="home-chat"
              callTestId="home-call"
              busy={props.busy}
              onChat={props.onStartChat}
              onCall={props.onStartCall}
            />
          </li>
        </ul>

        {hasPrevious ? (
          <div className="mt-6">
            <h2 className="mb-1 text-sm font-semibold text-[color:var(--color-muted)]">
              Previous spaces
            </h2>
            <ul>
              {props.chats.map((row) => (
                <SpaceRow
                  key={row.spaceId}
                  row={row}
                  displayName={props.displayName}
                  onChat={() => props.onOpenChat(row.spaceId)}
                  onCall={() => props.onOpenCall(row.spaceId)}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <details className="mt-8" data-testid="home-join">
        <summary className="cursor-pointer select-none text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]">
          Have an invite?
        </summary>
        <div className="mt-3 flex gap-2">
          <input
            data-testid="space-input"
            value={props.spaceInput}
            onChange={(e) => props.onSpaceInput(e.target.value)}
            aria-label="Invite link"
            className="field"
          />
          <button
            type="button"
            data-testid="join-space"
            disabled={props.busy || !joining}
            onClick={props.onJoinSpace}
            className="btn-secondary btn-secondary--sm"
          >
            Join
          </button>
        </div>
      </details>
    </div>
  );
}
