import type { Room } from '@trystero-p2p/torrent';
import { applyMaxBitrate } from '../media/sendQuality';
import { publishTracksToPeer, watchPeerTracks } from './peerMedia';

type PeerMap = Record<string, RTCPeerConnection>;

export function publishLocalToPeers(
  room: Room,
  localStream: MediaStream | null,
  target?: string,
): void {
  if (!localStream) return;
  const peers = room.getPeers() as PeerMap;
  const ids = target ? [target] : Object.keys(peers);
  for (const peerId of ids) {
    const pc = peers[peerId];
    if (pc) publishTracksToPeer(pc, localStream);
  }
  void room.addStream(localStream, target ? { target } : undefined);
}

export function replaceLocalTrackOnPeers(
  room: Room,
  oldTrack: MediaStreamTrack,
  newTrack: MediaStreamTrack,
): void {
  void room.replaceTrack(oldTrack, newTrack);
  for (const pc of Object.values(room.getPeers() as PeerMap)) {
    const sender = pc
      .getSenders()
      .find((s) => s.track === oldTrack || s.track?.kind === newTrack.kind);
    if (sender) void sender.replaceTrack(newTrack);
  }
}

/**
 * Enable/disable outbound video toward one peer via replaceTrack
 * (shared MediaStreamTrack.enabled would mute every peer).
 */
export function setOutboundVideoToPeer(
  room: Room,
  peerId: string,
  enabled: boolean,
  videoTrack: MediaStreamTrack | null,
): void {
  const pc = (room.getPeers() as PeerMap)[peerId];
  if (!pc || !videoTrack) return;
  const audioSender = pc.getSenders().find((s) => s.track?.kind === 'audio');
  const videoSender =
    pc.getSenders().find((s) => s.track?.kind === 'video' || s.track?.id === videoTrack.id) ??
    pc.getSenders().find((s) => s !== audioSender);
  if (videoSender) void videoSender.replaceTrack(enabled ? videoTrack : null);
}

export function applyBitrateOnPeers(room: Room, maxBitrateBps: number): void {
  for (const pc of Object.values(room.getPeers() as PeerMap)) {
    if (pc) void applyMaxBitrate(pc, maxBitrateBps);
  }
}

export function wirePeerMediaBridge(
  room: Room,
  peerId: string,
  onStream: (peerId: string, stream: MediaStream) => void,
  onConnected: () => void,
): () => void {
  const pc = room.getPeers()[peerId] as RTCPeerConnection | undefined;
  if (!pc) return () => undefined;

  const stopWatch = watchPeerTracks(pc, peerId, onStream);
  const onState = () => {
    if (pc.connectionState === 'connected' || pc.iceConnectionState === 'connected') {
      onConnected();
    }
  };
  pc.addEventListener('connectionstatechange', onState);
  pc.addEventListener('iceconnectionstatechange', onState);
  return () => {
    stopWatch();
    pc.removeEventListener('connectionstatechange', onState);
    pc.removeEventListener('iceconnectionstatechange', onState);
  };
}

export function schedulePublishes(
  peerId: string,
  publish: (peerId: string) => void,
  store: Map<string, number[]>,
  delays = [0, 800],
): void {
  const prev = store.get(peerId);
  if (prev) prev.forEach((id) => window.clearTimeout(id));
  store.set(
    peerId,
    delays.map((ms) => window.setTimeout(() => publish(peerId), ms)),
  );
}

export function clearScheduledPublishes(peerId: string, store: Map<string, number[]>): void {
  const timers = store.get(peerId);
  if (!timers) return;
  timers.forEach((id) => window.clearTimeout(id));
  store.delete(peerId);
}
