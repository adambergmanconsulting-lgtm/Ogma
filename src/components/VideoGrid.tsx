import type { PrivacyBackdropId } from '../domain/media/backgroundBlurBackdrop';
import type { RemotePeer } from '../domain/types';
import { VideoBlurControls } from './VideoBlurControls';
import { VideoTile } from './VideoTile';

interface VideoGridProps {
  localStream: MediaStream | null;
  localLabel: string;
  /** Vault id, shown beside a label only when that label is this person. */
  personId?: string | null;
  localMicOff: boolean;
  /** Local picture is a screen, so do not mirror or crop it. */
  localScreen?: boolean;
  blurSupported?: boolean;
  blurEnabled?: boolean;
  backdropSelectable?: boolean;
  backdropId?: PrivacyBackdropId;
  edgeCut?: number;
  onToggleBlur?: () => void;
  onBackdropChange?: (id: PrivacyBackdropId) => void;
  onEdgeCutChange?: (value: number) => void;
  remotePeers: RemotePeer[];
  pinnedPeerIds?: string[];
  onTogglePin?: (peerId: string) => void;
  applyAudioOutput?: (el: HTMLMediaElement | null) => void | Promise<void>;
  /** Band inside the chat column (not a full-bleed call place). */
  compact?: boolean;
}

function gridClass(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-1 md:grid-cols-2';
  if (count <= 4) return 'grid-cols-2';
  return 'grid-cols-2 lg:grid-cols-3';
}

export function VideoGrid({
  localStream,
  localLabel,
  personId,
  localMicOff,
  localScreen = false,
  blurSupported = false,
  blurEnabled = false,
  backdropSelectable = false,
  backdropId,
  edgeCut,
  onToggleBlur,
  onBackdropChange,
  onEdgeCutChange,
  remotePeers,
  pinnedPeerIds = [],
  onTogglePin,
  applyAudioOutput,
  compact,
}: VideoGridProps) {
  const total = 1 + remotePeers.length;
  const pad = compact ? 'h-full gap-1.5 p-0' : 'h-full flex-1 gap-2 p-2 md:gap-3 md:p-3';

  const renderLocal = (key: string) => (
    <VideoTile
      key={key}
      stream={localStream}
      label={localLabel}
      selfName={localLabel}
      personId={personId}
      muted
      mirrored={!localScreen}
      fit={localScreen ? 'contain' : 'cover'}
      micOff={localMicOff}
      showMicLevel
      overlay={
        !localScreen && blurSupported && onToggleBlur ? (
          <VideoBlurControls
            enabled={blurEnabled}
            backdropSelectable={backdropSelectable}
            backdropId={backdropId}
            edgeCut={edgeCut}
            onToggle={onToggleBlur}
            onBackdropChange={onBackdropChange}
            onEdgeCutChange={onEdgeCutChange}
          />
        ) : null
      }
    />
  );

  const remoteTiles = remotePeers.map((peer) => (
    <VideoTile
      key={peer.peerId}
      stream={peer.stream}
      label={peer.displayName}
      selfName={localLabel}
      personId={personId}
      fit={peer.sharingScreen ? 'contain' : 'cover'}
      pinned={pinnedPeerIds.includes(peer.peerId)}
      onTogglePin={onTogglePin ? () => onTogglePin(peer.peerId) : undefined}
      applyAudioOutput={applyAudioOutput}
    />
  ));

  // With peers: remotes first. On narrow viewports local is PiP so others fill the pane.
  if (remotePeers.length > 0) {
    return (
      <div className={`relative min-h-0 ${compact ? 'h-full' : 'h-full flex-1'}`}>
        <div className={`grid min-h-0 md:hidden ${pad} ${gridClass(remotePeers.length)}`}>
          {remoteTiles}
        </div>
        <div className={`hidden min-h-0 md:grid ${pad} ${gridClass(total)}`}>
          {remoteTiles}
          {renderLocal('local-desk')}
        </div>
        <div
          data-testid="local-pip"
          className="absolute bottom-2 right-2 z-10 h-28 w-20 overflow-hidden rounded-lg shadow-lg ring-1 ring-[color:var(--color-line)] sm:h-32 sm:w-24 md:hidden"
        >
          {renderLocal('local-pip')}
        </div>
      </div>
    );
  }

  return <div className={`grid min-h-0 ${pad} ${gridClass(total)}`}>{renderLocal('local')}</div>;
}
