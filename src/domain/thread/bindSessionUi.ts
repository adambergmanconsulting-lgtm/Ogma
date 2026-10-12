import { MAX_PEERS, type ChatMessage } from '../types';
import { roomFullLabel } from './capacityCopy';
import type { TextChatPayload } from './chatEnvelope';
import { JOIN_PEERS_UNREACHABLE } from './joinErrorMessage';
import type { ControlWire, MetaWire, ThreadSessionHandlers } from './sessionTypes';

export interface SessionUiBindings {
  cancelled: () => boolean;
  names: Map<string, string>;
  streams: Map<string, MediaStream>;
  screenShares: Map<string, boolean>;
  micOffs: Map<string, boolean>;
  displayName: () => string;
  sharingScreen: () => boolean;
  micOff: () => boolean;
  publishPeers: () => void;
  setConnectionState: (state: 'connected' | 'error') => void;
  setError: (message: string | null) => void;
  setMessages: (update: (prev: ChatMessage[]) => ChatMessage[]) => void;
  clearSessionRefs: () => void;
  sendMeta: (meta: MetaWire) => void;
  onSpeaking?: (peerId: string, level: number, ts: number) => void;
  onSubscribe?: (peerId: string, msg: Extract<ControlWire, { type: 'subscribe' }>) => void;
}

/** Wire Trystero session callbacks into React state updaters. */
export function bindSessionUi(ui: SessionUiBindings): ThreadSessionHandlers {
  return {
    onPeerJoin: (id) => {
      if (ui.cancelled()) return;
      ui.names.set(id, ui.names.get(id) ?? 'Peer');
      ui.setConnectionState('connected');
      ui.publishPeers();
      ui.sendMeta({
        displayName: ui.displayName(),
        sharingScreen: ui.sharingScreen(),
        micOff: ui.micOff(),
      });
    },
    onPeerLeave: (id) => {
      if (ui.cancelled()) return;
      ui.names.delete(id);
      ui.streams.delete(id);
      ui.screenShares.delete(id);
      ui.micOffs.delete(id);
      ui.publishPeers();
    },
    onPeerStream: (id, stream) => {
      if (ui.cancelled()) return;
      ui.streams.set(id, stream);
      ui.setConnectionState('connected');
      ui.publishPeers();
    },
    onChat: (id, wire: TextChatPayload) => {
      if (ui.cancelled()) return;
      ui.setMessages((prev) => [
        ...prev,
        {
          id: wire.id,
          peerId: id,
          displayName: wire.displayName || ui.names.get(id) || 'Peer',
          text: wire.text,
          sentAt: wire.sentAt,
        },
      ]);
    },
    onMeta: (id, meta) => {
      if (ui.cancelled()) return;
      let changed = false;
      if (meta.displayName) {
        ui.names.set(id, meta.displayName);
        changed = true;
      }
      if (typeof meta.sharingScreen === 'boolean') {
        if (meta.sharingScreen) ui.screenShares.set(id, true);
        else ui.screenShares.delete(id);
        changed = true;
      }
      if (typeof meta.micOff === 'boolean') {
        if (meta.micOff) ui.micOffs.set(id, true);
        else ui.micOffs.delete(id);
        changed = true;
      }
      if (changed) ui.publishPeers();
    },
    onSpeaking: (id, level, ts) => {
      if (ui.cancelled()) return;
      ui.onSpeaking?.(id, level, ts);
    },
    onSubscribe: (id, msg) => {
      if (ui.cancelled()) return;
      ui.onSubscribe?.(id, msg);
    },
    onJoinError: (message) => {
      if (ui.cancelled()) return;
      ui.setError(message || JOIN_PEERS_UNREACHABLE);
      ui.setConnectionState('error');
    },
    onRoomFull: () => {
      if (ui.cancelled()) return;
      ui.setError(roomFullLabel(MAX_PEERS));
      ui.setConnectionState('error');
      ui.clearSessionRefs();
    },
  };
}
