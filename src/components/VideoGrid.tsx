import type { RemotePeer } from '../domain/types';
import { VideoTile } from './VideoTile';

interface VideoGridProps {
  localStream: MediaStream | null;
  localLabel: string;
  localMicOff: boolean;
  remotePeers: RemotePeer[];
  pinnedPeerIds?: string[];
  onTogglePin?: (peerId: string) => void;
  applyAudioOutput?: (el: HTMLMediaElement | null) => void | Promise<void>;
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
  localMicOff,
  remotePeers,
  pinnedPeerIds = [],
  onTogglePin,
  applyAudioOutput,
}: VideoGridProps) {
  const total = 1 + remotePeers.length;

  return (
    <div className={`grid h-full min-h-0 flex-1 gap-2 p-2 md:gap-3 md:p-3 ${gridClass(total)}`}>
      <VideoTile
        stream={localStream}
        label={localLabel}
        muted
        mirrored
        micOff={localMicOff}
        showMicLevel
      />
      {remotePeers.map((peer) => (
        <VideoTile
          key={peer.peerId}
          stream={peer.stream}
          label={peer.displayName}
          pinned={pinnedPeerIds.includes(peer.peerId)}
          onTogglePin={onTogglePin ? () => onTogglePin(peer.peerId) : undefined}
          applyAudioOutput={applyAudioOutput}
        />
      ))}
    </div>
  );
}
