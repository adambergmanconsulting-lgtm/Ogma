import { joinRoom, selfId, type Room } from '@trystero-p2p/torrent';
import { ICE_SERVERS } from '../types';

export const TRYSTERO_APP_ID = 'ogma-thread-v1';

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
}

export interface ThreadSession {
  selfId: string;
  room: Room;
  sendChat: (message: ChatWire) => Promise<void>;
  sendMeta: (meta: MetaWire) => Promise<void>;
  addStream: (stream: MediaStream) => void;
  replaceTrack: (oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack) => void;
  leave: () => Promise<void>;
}

export function openThreadSession(roomSecret: string, handlers: ThreadSessionHandlers): ThreadSession {
  const room = joinRoom(
    {
      appId: TRYSTERO_APP_ID,
      rtcConfig: { iceServers: ICE_SERVERS },
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

  room.onPeerJoin = (peerId) => {
    handlers.onPeerJoin(peerId);
  };
  room.onPeerLeave = (peerId) => {
    handlers.onPeerLeave(peerId);
  };
  room.onPeerStream = (stream, peerId) => {
    handlers.onPeerStream(peerId, stream);
  };

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
