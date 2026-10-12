import { openPayload } from './envelope';
import type { LoomStore } from './storePort';

/** True if this author already has a sealed join in hot or cold. */
export async function authorHasJoin(
  store: LoomStore,
  spaceId: string,
  secret: string,
  author: string,
): Promise<boolean> {
  const self = author.trim().toLowerCase();
  if (!self) return true;
  const rows = [
    ...(await store.listMessages(spaceId)),
    ...(await store.listColdMessages(spaceId)),
  ];
  for (const row of rows) {
    if (row.author.trim().toLowerCase() !== self) continue;
    try {
      const payload = await openPayload(secret, row);
      if (payload.kind === 'join') return true;
    } catch {
      // skip
    }
  }
  return false;
}
