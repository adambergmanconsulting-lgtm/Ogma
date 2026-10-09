/** Room product mode — free P2P core vs paid team (SFU/images later). */

export type RoomMode = 'free' | 'team';

export const DEFAULT_ROOM_MODE: RoomMode = 'free';

export function isPaidTeamMode(mode: RoomMode): boolean {
  return mode === 'team';
}

/** Free path refuses binary chat; team may accept image-ref later. */
export function allowsBinaryChat(mode: RoomMode): boolean {
  return mode === 'team';
}
