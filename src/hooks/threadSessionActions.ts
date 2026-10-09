import type { ThreadSession } from '../domain/thread/session';
import type { ChatMessage } from '../domain/types';

export function sendThreadChat(
  session: ThreadSession,
  displayName: string,
  text: string,
  append: (message: ChatMessage) => void,
): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  const name = displayName.trim() || 'Guest';
  const message: ChatMessage = {
    id: `${session.selfId}-${Date.now()}`,
    peerId: session.selfId,
    displayName: name,
    text: trimmed,
    sentAt: Date.now(),
  };
  append(message);
  void session.sendChat({
    kind: 'text',
    id: message.id,
    text: message.text,
    displayName: message.displayName,
    sentAt: message.sentAt,
  });
}

export function replaceSessionTrack(
  session: ThreadSession,
  localStream: MediaStream,
  track: MediaStreamTrack,
): void {
  const old = localStream.getTracks().find((t) => t.kind === track.kind);
  if (old && old !== track) session.replaceTrack(old, track);
}
