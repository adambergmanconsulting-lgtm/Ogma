import type { ChatMessage } from '../types';
import type { ChatWire, MetaWire, ThreadSessionHandlers } from './session';

export interface SessionUiBindings {
  cancelled: () => boolean;
  names: Map<string, string>;
  streams: Map<string, MediaStream>;
  displayName: () => string;
  publishPeers: () => void;
  setConnectionState: (state: 'connected' | 'error') => void;
  setError: (message: string | null) => void;
  setMessages: (update: (prev: ChatMessage[]) => ChatMessage[]) => void;
  clearSessionRefs: () => void;
  sendMeta: (meta: MetaWire) => void;
}

/** Wire Trystero session callbacks into React state updaters. */
export function bindSessionUi(ui: SessionUiBindings): ThreadSessionHandlers {
  return {
    onPeerJoin: (id) => {
      if (ui.cancelled()) return;
      ui.names.set(id, ui.names.get(id) ?? 'Peer');
      ui.setConnectionState('connected');
      ui.publishPeers();
      ui.sendMeta({ displayName: ui.displayName() });
    },
    onPeerLeave: (id) => {
      if (ui.cancelled()) return;
      ui.names.delete(id);
      ui.streams.delete(id);
      ui.publishPeers();
    },
    onPeerStream: (id, stream) => {
      if (ui.cancelled()) return;
      ui.streams.set(id, stream);
      ui.setConnectionState('connected');
      ui.publishPeers();
    },
    onChat: (id, wire: ChatWire) => {
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
      if (meta.displayName) {
        ui.names.set(id, meta.displayName);
        ui.publishPeers();
      }
    },
    onJoinError: (message) => {
      if (ui.cancelled()) return;
      ui.setError(message || "Couldn't reach peers — network may block P2P.");
      ui.setConnectionState('error');
    },
    onRoomFull: () => {
      if (ui.cancelled()) return;
      ui.setError('Room is full (max 6 people).');
      ui.setConnectionState('error');
      ui.clearSessionRefs();
    },
  };
}
