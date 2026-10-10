import { wrapSpaceSecret } from './deviceKey';
import type { LoomStore } from './storePort';
import type { SpaceIndexRow } from './types';

/** Honest when the index row exists but this browser no longer holds the invite. */
export const SPACE_SECRET_MISSING =
  'This chat’s invite isn’t saved on this browser. Paste an invite link to open it.';

/** Memory → localSecret (no vault) — not wrappedSecret (needs unwrap). */
export function secretFromSpaceRow(
  spaceId: string,
  row: SpaceIndexRow | null | undefined,
  memory: Map<string, string>,
): string | null {
  return memory.get(spaceId) ?? row?.localSecret ?? null;
}

/** Persist invite for reopen: wrap when vault key exists, else localSecret in IDB. */
export async function persistSpaceSecret(
  store: LoomStore,
  row: SpaceIndexRow,
  secret: string,
  wrapKey: CryptoKey | null,
): Promise<SpaceIndexRow> {
  if (wrapKey) {
    if (row.wrappedSecret && !row.localSecret) return row;
    const wrapped = row.wrappedSecret ?? (await wrapSpaceSecret(wrapKey, secret));
    const next: SpaceIndexRow = { ...row, wrappedSecret: wrapped };
    delete next.localSecret;
    await store.putSpace(next);
    return next;
  }
  if (row.localSecret === secret) return row;
  const next: SpaceIndexRow = { ...row, localSecret: secret };
  await store.putSpace(next);
  return next;
}

/** Load browser-local invites into memory (Continue without vault / after refresh). */
export function hydrateLocalSecrets(
  rows: SpaceIndexRow[],
  into: Map<string, string>,
): void {
  for (const row of rows) {
    if (row.localSecret && !into.has(row.spaceId)) {
      into.set(row.spaceId, row.localSecret);
    }
  }
}

/** After Add vault key: wrap remembered + local secrets; drop localSecret. */
export async function wrapStoredSpaceSecrets(
  wrapKey: CryptoKey,
  store: LoomStore,
  rows: SpaceIndexRow[],
  memory: Map<string, string>,
): Promise<void> {
  for (const row of rows) {
    const secret = memory.get(row.spaceId) ?? row.localSecret;
    if (!secret) continue;
    memory.set(row.spaceId, secret);
    if (row.wrappedSecret && !row.localSecret) continue;
    const wrapped = row.wrappedSecret ?? (await wrapSpaceSecret(wrapKey, secret));
    const next: SpaceIndexRow = { ...row, wrappedSecret: wrapped };
    delete next.localSecret;
    await store.putSpace(next);
  }
}
