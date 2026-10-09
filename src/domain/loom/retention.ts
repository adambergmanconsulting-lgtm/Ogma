import { compareEnvelopes } from './envelope';
import type { LoomStore } from './storePort';
import {
  MESSAGE_KEEP_CAP,
  MESSAGE_LOAD_OLDER_BATCH,
  type LoomEnvelope,
  type StoredMessage,
} from './types';

/** Ids of messages older than the newest `keep` (by ts then id). */
export function messageIdsPastKeepCap(
  messages: LoomEnvelope[],
  keep: number = MESSAGE_KEEP_CAP,
): string[] {
  if (keep < 1 || messages.length <= keep) return [];
  const sorted = [...messages].sort(compareEnvelopes);
  return sorted.slice(0, sorted.length - keep).map((m) => m.id);
}

/** Move oldest hot messages to cold so at most `keep` remain hot. */
export async function trimSpaceMessages(
  store: LoomStore,
  spaceId: string,
  keep: number = MESSAGE_KEEP_CAP,
): Promise<number> {
  const drop = messageIdsPastKeepCap(await store.listMessages(spaceId), keep);
  if (drop.length === 0) return 0;
  await store.moveMessagesToCold(drop);
  return drop.length;
}

/**
 * Next cold batch older than `before` (exclusive), newest-of-the-old first
 * then returned in chronological order for prepending.
 */
export function pickColdBatch(
  cold: StoredMessage[],
  before: { ts: number; id: string } | null,
  shownIds: Set<string>,
  batch: number = MESSAGE_LOAD_OLDER_BATCH,
): StoredMessage[] {
  const candidates = cold
    .filter((m) => !shownIds.has(m.id))
    .filter((m) => {
      if (!before) return true;
      if (m.ts !== before.ts) return m.ts < before.ts;
      return m.id < before.id;
    })
    .sort(compareEnvelopes);
  if (candidates.length === 0) return [];
  return candidates.slice(Math.max(0, candidates.length - batch));
}

export async function hasUnloadableCold(
  store: LoomStore,
  spaceId: string,
  shownIds: Set<string>,
): Promise<boolean> {
  const cold = await store.listColdMessages(spaceId);
  return cold.some((m) => !shownIds.has(m.id));
}
