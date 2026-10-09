import {
  defaultRelayUrls,
  getRelaySockets,
  joinRoom,
  selfId,
  type Room,
} from '@trystero-p2p/torrent';
import { ICE_SERVERS, MAX_PEERS } from '../types';

export const TRYSTERO_APP_ID = 'ogma-thread-v1';

/** Use the full public tracker list so both peers announce to the same relays. */
export const THREAD_TRACKER_URLS = [...defaultRelayUrls];

export type RelayHealth = {
  url: string;
  readyState: number;
};

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

export type MetaWire = {
  displayName: string;
};

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
      // Explicit urls → both clients use every tracker (redundancy slice skipped).
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

  chat.onMessage = (data, context) => {
    handlers.onChat(context.peerId, data);
  };
  meta.onMessage = (data, context) => {
    handlers.onMeta(context.peerId, data);
  };

  const enforceCapacity = () => {
    // MAX_PEERS includes self → more than MAX_PEERS - 1 remotes means room is over capacity.
    if (remotePeerCount(room) > MAX_PEERS - 1) {
      handlers.onRoomFull();
      void room.leave();
      return true;
    }
    return false;
  };

  room.onPeerJoin = (peerId) => {
    if (enforceCapacity()) return;
    handlers.onPeerJoin(peerId);
  };
  room.onPeerLeave = (peerId) => {
    handlers.onPeerLeave(peerId);
  };
  room.onPeerStream = (stream, peerId) => {
    if (remotePeerCount(room) > MAX_PEERS - 1) return;
    handlers.onPeerStream(peerId, stream);
  };

  // Immediate check if we joined an already-full swarm.
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
      void room.addStream(stream);
    },
    replaceTrack(oldTrack, newTrack) {
      void room.replaceTrack(oldTrack, newTrack);
    },
    peerCount() {
      return remotePeerCount(room) + 1;
    },
    async leave() {
      room.onPeerJoin = null;
      room.onPeerLeave = null;
      room.onPeerStream = null;
      chat.onMessage = null;
      meta.onMessage = null;
      await room.leave();
    },
  };
}
