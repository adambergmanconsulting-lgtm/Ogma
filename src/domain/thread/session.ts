import {
  defaultRelayUrls,
  getRelaySockets,
  joinRoom,
  selfId,
  type Room,
} from '@trystero-p2p/torrent';
import { ICE_SERVERS, MAX_PEERS } from '../types';
import {
  clearScheduledPublishes,
  publishLocalToPeers,
  replaceLocalTrackOnPeers,
  schedulePublishes,
  wirePeerMediaBridge,
} from './publishMedia';

export const TRYSTERO_APP_ID = 'ogma-thread-v1';
export const THREAD_TRACKER_URLS = [...defaultRelayUrls];

export type RelayHealth = { url: string; readyState: number };

export function listRelayHealth(): RelayHealth[] {
  const sockets = getRelaySockets() as Record<string, WebSocket | undefined>;
  return Object.entries(sockets).map(([url, socket]) => ({
    url,
    readyState: socket?.readyState ?? WebSocket.CLOSED,
  }));
}

const WS_OPEN = 1;

export function countOpenRelays(health = listRelayHealth()): number {
  return health.filter((h) => h.readyState === WS_OPEN).length;
}

export type ChatWire = {
  id: string;
  text: string;
  displayName: string;
  sentAt: number;
};

export type MetaWire = { displayName: string };

export interface ThreadSessionHandlers {
  onPeerJoin: (peerId: string) => void;
  onPeerLeave: (peerId: string) => void;
  onPeerStream: (peerId: string, stream: MediaStream) => void;
  onChat: (peerId: string, message: ChatWire) => void;
  onMeta: (peerId: string, meta: MetaWire) => void;
  onJoinError: (message: string) => void;
  onRoomFull: () => void;
}

export interface ThreadSession {
  selfId: string;
  room: Room;
  sendChat: (message: ChatWire) => Promise<void>;
  sendMeta: (meta: MetaWire) => Promise<void>;
  addStream: (stream: MediaStream) => void;
  replaceTrack: (oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack) => void;
  peerCount: () => number;
  leave: () => Promise<void>;
}

function remotePeerCount(room: Room): number {
  return Object.keys(room.getPeers()).length;
}

export function openThreadSession(roomSecret: string, handlers: ThreadSessionHandlers): ThreadSession {
  const room = joinRoom(
    {
      appId: TRYSTERO_APP_ID,
      rtcConfig: { iceServers: ICE_SERVERS },
      relayConfig: { urls: THREAD_TRACKER_URLS },
    },
    roomSecret,
    {
      onJoinError: (err) => {
        const message =
          typeof err === 'object' && err && 'message' in err
            ? String((err as { message: unknown }).message)
            : String(err);
        handlers.onJoinError(message || "Couldn't reach peers — network may block P2P.");
      },
    },
  );

  const chat = room.makeAction<ChatWire>('chat');
  const meta = room.makeAction<MetaWire>('meta');
  let localStream: MediaStream | null = null;
  const trackUnsubs = new Map<string, () => void>();
  const publishTimers = new Map<string, number[]>();

  chat.onMessage = (data, context) => handlers.onChat(context.peerId, data);
  meta.onMessage = (data, context) => handlers.onMeta(context.peerId, data);

  const publish = (target?: string) => publishLocalToPeers(room, localStream, target);

  const enforceCapacity = () => {
    if (remotePeerCount(room) > MAX_PEERS - 1) {
      handlers.onRoomFull();
      void room.leave();
      return true;
    }
    return false;
  };

  const onRemoteStream = (peerId: string, stream: MediaStream) => {
    if (remotePeerCount(room) > MAX_PEERS - 1) return;
    handlers.onPeerStream(peerId, stream);
  };

  room.onPeerJoin = (peerId) => {
    if (enforceCapacity()) return;
    handlers.onPeerJoin(peerId);
    trackUnsubs.get(peerId)?.();
    trackUnsubs.set(
      peerId,
      wirePeerMediaBridge(room, peerId, onRemoteStream, () => publish(peerId)),
    );
    schedulePublishes(peerId, publish, publishTimers);
  };
  room.onPeerLeave = (peerId) => {
    clearScheduledPublishes(peerId, publishTimers);
    trackUnsubs.get(peerId)?.();
    trackUnsubs.delete(peerId);
    handlers.onPeerLeave(peerId);
  };
  room.onPeerStream = (stream, peerId) => onRemoteStream(peerId, stream);

  queueMicrotask(() => {
    enforceCapacity();
  });

  return {
    selfId,
    room,
    async sendChat(message) {
      await chat.send(message);
    },
    async sendMeta(m) {
      await meta.send(m);
    },
    addStream(stream) {
      localStream = stream;
      publish();
      for (const peerId of Object.keys(room.getPeers())) {
        schedulePublishes(peerId, publish, publishTimers);
      }
    },
    replaceTrack(oldTrack, newTrack) {
      replaceLocalTrackOnPeers(room, oldTrack, newTrack);
    },
    peerCount() {
      return remotePeerCount(room) + 1;
    },
    async leave() {
      localStream = null;
      for (const peerId of [...publishTimers.keys()]) {
        clearScheduledPublishes(peerId, publishTimers);
      }
      for (const unsub of trackUnsubs.values()) unsub();
      trackUnsubs.clear();
      room.onPeerJoin = null;
      room.onPeerLeave = null;
      room.onPeerStream = null;
      chat.onMessage = null;
      meta.onMessage = null;
      await room.leave();
    },
  };
}
