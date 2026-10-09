import { bindSessionUi } from '../domain/thread/bindSessionUi';
import { syncLocalStream } from '../domain/thread/peerState';
import type { RoomMode } from '../domain/thread/roomMode';
import {
  countOpenRelays,
  openThreadSession,
  type ControlWire,
  type ThreadSession,
} from '../domain/thread/session';
import type { SpeakingSample } from '../domain/thread/subscribe';
import type { ChatMessage } from '../domain/types';

export type BoundSessionHooks = {
  cancelled: () => boolean;
  names: Map<string, string>;
  streams: Map<string, MediaStream>;
  speaking: Map<string, SpeakingSample>;
  subscribeFromPeers: Map<string, Extract<ControlWire, { type: 'subscribe' }>>;
  displayName: () => string;
  publishPeers: () => void;
  setConnectionState: (state: 'connected' | 'error') => void;
  setError: (message: string | null) => void;
  setMessages: (update: (prev: ChatMessage[]) => ChatMessage[]) => void;
  clearSessionRefs: () => void;
  onSpeakingTick: () => void;
  onSubscribeTick: () => void;
  localStream: MediaStream | null;
};

/** Open Trystero session and attach current local media. */
export function openBoundSession(
  roomId: string,
  roomMode: RoomMode,
  hooks: BoundSessionHooks,
): { session: ThreadSession; openRelays: number } {
  let session!: ThreadSession;
  session = openThreadSession(
    roomId,
    bindSessionUi({
      cancelled: hooks.cancelled,
      names: hooks.names,
      streams: hooks.streams,
      displayName: hooks.displayName,
      publishPeers: hooks.publishPeers,
      setConnectionState: hooks.setConnectionState,
      setError: hooks.setError,
      setMessages: hooks.setMessages,
      clearSessionRefs: hooks.clearSessionRefs,
      sendMeta: (meta) => {
        void session.sendMeta(meta);
      },
      onSpeaking: (id, level, ts) => {
        hooks.speaking.set(id, { level, ts });
        hooks.onSpeakingTick();
      },
      onSubscribe: (id, msg) => {
        hooks.subscribeFromPeers.set(id, msg);
        hooks.onSubscribeTick();
      },
    }),
    roomMode,
  );

  void session.sendMeta({ displayName: hooks.displayName() });
  if (hooks.localStream) syncLocalStream(session, null, hooks.localStream);
  hooks.onSpeakingTick();
  return { session, openRelays: countOpenRelays() };
}
