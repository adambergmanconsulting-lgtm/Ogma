import { isSpeakingLevel } from '../media/micLevel';

export type SpeakingSample = { level: number; ts: number };

const SPEAKING_STALE_MS = 2_500;

/** Active speakers with recent level above threshold. */
export function activeSpeakerIds(
  levels: Map<string, SpeakingSample>,
  now = Date.now(),
): string[] {
  const ids: string[] = [];
  for (const [peerId, sample] of levels) {
    if (now - sample.ts > SPEAKING_STALE_MS) continue;
    if (isSpeakingLevel(sample.level)) ids.push(peerId);
  }
  return ids;
}

/**
 * Whom we want video from: pins + active speakers, or everyone when showAll.
 * Self is never listed (local preview is local).
 */
export function computeWantVideoFrom(options: {
  remotePeerIds: string[];
  pins: string[];
  speaking: Map<string, SpeakingSample>;
  showAll: boolean;
  now?: number;
}): string[] {
  const { remotePeerIds, pins, speaking, showAll, now = Date.now() } = options;
  if (showAll) return [...remotePeerIds];

  const want = new Set<string>();
  for (const id of pins) {
    if (remotePeerIds.includes(id)) want.add(id);
  }
  for (const id of activeSpeakerIds(speaking, now)) {
    if (remotePeerIds.includes(id)) want.add(id);
  }
  // If nobody speaking and no pins, keep first remote so the grid is not empty.
  if (want.size === 0 && remotePeerIds[0]) want.add(remotePeerIds[0]);
  return [...want];
}

/** Whether we should send video to a peer given their subscribe message. */
export function shouldSendVideoToPeer(
  selfId: string,
  subscribe: { wantVideoFrom: string[]; showAll?: boolean },
): boolean {
  if (subscribe.showAll) return true;
  return subscribe.wantVideoFrom.includes(selfId);
}
