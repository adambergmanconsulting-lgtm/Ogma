import type { RemotePeer } from '../types';
import type { ThreadSession } from './session';

export function listRemotePeers(
  streams: Map<string, MediaStream>,
  names: Map<string, string>,
  sharingScreen: Map<string, boolean> = new Map(),
): RemotePeer[] {
  const list: RemotePeer[] = [];
  const seen = new Set<string>();
  for (const [id, stream] of streams) {
    seen.add(id);
    list.push({
      peerId: id,
      displayName: names.get(id) ?? 'Peer',
      stream,
      connectionState: 'connected',
      sharingScreen: sharingScreen.get(id) === true,
    });
  }
  for (const [id, name] of names) {
    if (seen.has(id)) continue;
    list.push({
      peerId: id,
      displayName: name,
      stream: null,
      connectionState: 'connecting',
      sharingScreen: sharingScreen.get(id) === true,
    });
  }
  return list;
}

export function syncLocalStream(
  session: ThreadSession,
  prev: MediaStream | null,
  next: MediaStream,
): void {
  if (!prev) {
    session.addStream(next);
    return;
  }
  for (const track of next.getTracks()) {
    const old = prev.getTracks().find((t) => t.kind === track.kind);
    if (old && old !== track) {
      session.replaceTrack(old, track);
    } else if (!old) {
      session.addStream(next);
      return;
    }
  }
}
