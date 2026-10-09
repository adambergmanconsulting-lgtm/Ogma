import type { Room } from '@trystero-p2p/torrent';
import type { TextChatPayload } from './chatEnvelope';
import type { MediaPlane } from './mediaPlane';
import type { RoomMode } from './roomMode';

export type MetaWire = { displayName: string };

export type ControlWire =
  | { type: 'speaking'; level: number; ts: number }
  | { type: 'subscribe'; wantVideoFrom: string[]; pins: string[]; showAll?: boolean };

export type SubscribeControl = Extract<ControlWire, { type: 'subscribe' }>;

export interface ThreadSessionHandlers {
  onPeerJoin: (peerId: string) => void;
  onPeerLeave: (peerId: string) => void;
  onPeerStream: (peerId: string, stream: MediaStream) => void;
  onChat: (peerId: string, message: TextChatPayload) => void;
  onMeta: (peerId: string, meta: MetaWire) => void;
  onSpeaking: (peerId: string, level: number, ts: number) => void;
  onSubscribe: (peerId: string, msg: SubscribeControl) => void;
  onJoinError: (message: string) => void;
  onRoomFull: () => void;
}

export interface ThreadSession {
  selfId: string;
  room: Room;
  mediaPlane: MediaPlane;
  roomMode: RoomMode;
  sendChat: (message: TextChatPayload) => Promise<void>;
  sendMeta: (meta: MetaWire) => Promise<void>;
  sendSpeaking: (level: number) => Promise<void>;
  sendSubscribe: (msg: SubscribeControl) => Promise<void>;
  addStream: (stream: MediaStream) => void;
  replaceTrack: (oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack) => void;
  setOutboundVideoEnabled: (
    peerId: string,
    enabled: boolean,
    videoTrack?: MediaStreamTrack | null,
  ) => void;
  applySendBitrate: (maxBitrateBps: number) => void;
  peerCount: () => number;
  leave: () => Promise<void>;
}
