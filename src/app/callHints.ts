import { extractRoomSecret } from '../domain/signaling/share';
import { roomDisplayCode } from '../domain/signaling/room';

export function lobbyInviteCode(
  inviteMode: boolean,
  roomInput: string,
  activeRoom: string | null,
): string {
  if (!inviteMode) return '';
  const id = extractRoomSecret(roomInput) || activeRoom;
  return id ? roomDisplayCode(id) : '';
}

export function waitingAloneHint(remoteCount: number): string | null {
  if (remoteCount > 0) return null;
  return 'Waiting alone — copy the invite link above and send it. Do not both Create room.';
}
