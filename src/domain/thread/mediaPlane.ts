import type { Room } from '@trystero-p2p/torrent';
import {
  publishLocalToPeers,
  replaceLocalTrackOnPeers,
  setOutboundVideoToPeer,
  applyBitrateOnPeers,
} from './publishMedia';

/** Free path = mesh; paid team may attach an SFU adapter later. */
export type MediaPlaneKind = 'mesh' | 'sfu';

export interface MediaPlane {
  readonly kind: MediaPlaneKind;
  publishLocal(stream: MediaStream | null, target?: string): void;
  replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack): void;
  setOutboundVideoEnabled(
    peerId: string,
    enabled: boolean,
    videoTrack: MediaStreamTrack | null,
  ): void;
  applySendBitrate(maxBitrateBps: number): void;
  peerConnections(): RTCPeerConnection[];
}

type PeerMap = Record<string, RTCPeerConnection>;

/** Trystero full-mesh adapter — current free Thread media plane. */
export function createMeshMediaPlane(room: Room): MediaPlane {
  return {
    kind: 'mesh',
    publishLocal(stream, target) {
      publishLocalToPeers(room, stream, target);
    },
    replaceTrack(oldTrack, newTrack) {
      replaceLocalTrackOnPeers(room, oldTrack, newTrack);
    },
    setOutboundVideoEnabled(peerId, enabled, videoTrack) {
      setOutboundVideoToPeer(room, peerId, enabled, videoTrack);
    },
    applySendBitrate(maxBitrateBps) {
      applyBitrateOnPeers(room, maxBitrateBps);
    },
    peerConnections() {
      return Object.values(room.getPeers() as PeerMap).filter(Boolean);
    },
  };
}
