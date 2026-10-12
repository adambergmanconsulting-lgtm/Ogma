import type { ReactNode } from 'react';
import type { PrivacyBackdropId } from '../domain/media/backgroundBlurBackdrop';
import { resolveScreenSpotlight } from '../domain/media/screenShare';
import {
  cameraTileAspect,
  cameraTileFrameClass,
  type CameraTileAspect,
} from '../domain/media/videoTileAspect';
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

const PIP_CHIP =
  'video-tile-pip overflow-hidden rounded-lg shadow-lg ring-1 ring-[color:var(--color-line)]';

function gridClass(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-1 md:grid-cols-2';
  if (count <= 4) return 'grid-cols-2';
  return 'grid-cols-2 lg:grid-cols-3';
}

function CameraFrame(props: {
  aspect: CameraTileAspect;
  children: ReactNode;
}): ReactNode {
  return (
    <div className="video-tile-cell">
      <div
        data-testid="camera-tile-frame"
        data-aspect={props.aspect}
        className={cameraTileFrameClass(props.aspect)}
      >
        {props.children}
      </div>
    </div>
  );
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
  const aspect = cameraTileAspect(total);
  const pad = compact ? 'h-full gap-1.5 p-0' : 'h-full flex-1 gap-2 p-2 md:gap-3 md:p-3';
  const spotlight = resolveScreenSpotlight({ localScreen, remotePeers });

  const renderLocal = (key: string, opts?: { pip?: boolean }) => (
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
        !opts?.pip && !localScreen && blurSupported && onToggleBlur ? (
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

  const renderRemote = (peer: RemotePeer, key?: string) => (
    <VideoTile
      key={key ?? peer.peerId}
      stream={peer.stream}
      label={peer.displayName}
      selfName={localLabel}
      personId={personId}
      fit={peer.sharingScreen ? 'contain' : 'cover'}
      micOff={peer.micOff}
      pinned={pinnedPeerIds.includes(peer.peerId)}
      onTogglePin={onTogglePin ? () => onTogglePin(peer.peerId) : undefined}
      applyAudioOutput={applyAudioOutput}
    />
  );

  // Shared screen fills the video window; other people stay as PiP chips.
  if (spotlight?.kind === 'local') {
    return (
      <div
        data-testid="screen-spotlight"
        className={`relative min-h-0 ${compact ? 'h-full' : 'h-full flex-1'}`}
      >
        <div className={`absolute inset-0 min-h-0 ${compact ? 'p-0' : 'p-2 md:p-3'}`}>
          {renderLocal('screen-main')}
        </div>
        <div
          data-testid="screen-spotlight-pips"
          className="absolute bottom-2 right-2 z-10 flex max-w-[calc(100%-1rem)] flex-row-reverse flex-wrap justify-start gap-1.5"
        >
          {remotePeers.map((peer) => (
            <div key={peer.peerId} className={PIP_CHIP}>
              {renderRemote(peer)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (spotlight?.kind === 'remote') {
    const featuredPeer = remotePeers.find((p) => p.peerId === spotlight.peerId);
    if (featuredPeer) {
      return (
        <div
          data-testid="screen-spotlight"
          className={`relative min-h-0 ${compact ? 'h-full' : 'h-full flex-1'}`}
        >
          <div className={`absolute inset-0 min-h-0 ${compact ? 'p-0' : 'p-2 md:p-3'}`}>
            {renderRemote(featuredPeer, 'screen-main')}
          </div>
          <div
            data-testid="screen-spotlight-pips"
            className="absolute bottom-2 right-2 z-10 flex max-w-[calc(100%-1rem)] flex-row-reverse flex-wrap justify-start gap-1.5"
          >
            <div data-testid="local-pip" className={PIP_CHIP}>
              {renderLocal('local-pip', { pip: true })}
            </div>
            {remotePeers
              .filter((p) => p.peerId !== featuredPeer.peerId)
              .map((peer) => (
                <div key={peer.peerId} className={PIP_CHIP}>
                  {renderRemote(peer)}
                </div>
              ))}
          </div>
        </div>
      );
    }
  }

  const frameRemotes = () =>
    remotePeers.map((peer) => (
      <CameraFrame key={peer.peerId} aspect={aspect}>
        {renderRemote(peer)}
      </CameraFrame>
    ));

  // With peers: remotes first. On narrow viewports local is PiP so others fill the pane.
  if (remotePeers.length > 0) {
    return (
      <div className={`relative min-h-0 ${compact ? 'h-full' : 'h-full flex-1'}`}>
        <div className={`grid min-h-0 md:hidden ${pad} ${gridClass(remotePeers.length)}`}>
          {frameRemotes()}
        </div>
        <div className={`hidden min-h-0 md:grid ${pad} ${gridClass(total)}`}>
          {frameRemotes()}
          <CameraFrame aspect={aspect}>{renderLocal('local-desk')}</CameraFrame>
        </div>
        <div data-testid="local-pip" className={`absolute bottom-2 right-2 z-10 md:hidden ${PIP_CHIP}`}>
          {renderLocal('local-pip', { pip: true })}
        </div>
      </div>
    );
  }

  return (
    <div className={`grid min-h-0 ${pad} ${gridClass(total)}`}>
      <CameraFrame aspect={aspect}>{renderLocal('local')}</CameraFrame>
    </div>
  );
}
