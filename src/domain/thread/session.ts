import { joinRoom, selfId } from '@trystero-p2p/torrent';
import { ICE_SERVERS, MAX_PEERS } from '../types';
import {
  normalizeInboundChat,
  textChatPayload,
  type TextChatPayload,
} from './chatEnvelope';
import { createMeshMediaPlane } from './mediaPlane';
import {
  clearScheduledPublishes,
  schedulePublishes,
  wirePeerMediaBridge,
} from './publishMedia';
import { THREAD_TRACKER_URLS, TRYSTERO_APP_ID } from './relayHealth';
import { allowsBinaryChat, DEFAULT_ROOM_MODE, type RoomMode } from './roomMode';
import type {
  ControlWire,
  MetaWire,
  ThreadSession,
  ThreadSessionHandlers,
} from './sessionTypes';

export { countOpenRelays, listRelayHealth, THREAD_TRACKER_URLS, TRYSTERO_APP_ID } from './relayHealth';
export type { RelayHealth } from './relayHealth';
export type { TextChatPayload };
export type { ChatWire } from './chatEnvelope';
export type {
  ControlWire,
  MetaWire,
  SubscribeControl,
  ThreadSession,
  ThreadSessionHandlers,
} from './sessionTypes';

function remotePeerCount(room: { getPeers: () => object }): number {
  return Object.keys(room.getPeers()).length;
}

export function openThreadSession(
  roomSecret: string,
  handlers: ThreadSessionHandlers,
  roomMode: RoomMode = DEFAULT_ROOM_MODE,
): ThreadSession {
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

  const mediaPlane = createMeshMediaPlane(room);
  const allowBinary = allowsBinaryChat(roomMode);
  const chat = room.makeAction<TextChatPayload>('chat');
  const meta = room.makeAction<MetaWire>('meta');
  const control = room.makeAction<ControlWire>('control');
  let localStream: MediaStream | null = null;
  const trackUnsubs = new Map<string, () => void>();
  const publishTimers = new Map<string, number[]>();

  chat.onMessage = (data, context) => {
    const normalized = normalizeInboundChat(data, allowBinary);
    if (!normalized || normalized.kind !== 'text') return;
    handlers.onChat(context.peerId, normalized);
  };
  meta.onMessage = (data, context) => handlers.onMeta(context.peerId, data);
  control.onMessage = (data, context) => {
    if (!data || typeof data !== 'object') return;
    if (data.type === 'speaking') {
      handlers.onSpeaking(context.peerId, data.level, data.ts);
      return;
    }
    if (data.type === 'subscribe') handlers.onSubscribe(context.peerId, data);
  };

  const publish = (target?: string) => mediaPlane.publishLocal(localStream, target);

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
    mediaPlane,
    roomMode,
    async sendChat(message) {
      await chat.send(
        textChatPayload(message.id, message.text, message.displayName, message.sentAt),
      );
    },
    async sendMeta(m) {
      await meta.send(m);
    },
    async sendSpeaking(level) {
      await control.send({ type: 'speaking', level, ts: Date.now() });
    },
    async sendSubscribe(msg) {
      await control.send({
        type: 'subscribe',
        wantVideoFrom: msg.wantVideoFrom,
        pins: msg.pins,
        showAll: msg.showAll,
      });
    },
    addStream(stream) {
      localStream = stream;
      publish();
      for (const peerId of Object.keys(room.getPeers())) {
        schedulePublishes(peerId, publish, publishTimers);
      }
    },
    replaceTrack(oldTrack, newTrack) {
      mediaPlane.replaceTrack(oldTrack, newTrack);
    },
    setOutboundVideoEnabled(peerId, enabled, videoTrack) {
      const track =
        videoTrack ?? localStream?.getVideoTracks().find((t) => t.readyState === 'live') ?? null;
      mediaPlane.setOutboundVideoEnabled(peerId, enabled, track);
    },
    applySendBitrate(maxBitrateBps) {
      mediaPlane.applySendBitrate(maxBitrateBps);
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
      control.onMessage = null;
      await room.leave();
    },
  };
}
