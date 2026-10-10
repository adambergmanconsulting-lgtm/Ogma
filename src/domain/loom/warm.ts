import type { SpaceIndexRow } from './types';
import { WARM_CAP } from './types';

/**
 * Pick warm space ids: focused first, then by last activity (secret available).
 * Cap = WARM_CAP (3).
 */
export function pickWarmSpaceIds(
  rows: SpaceIndexRow[],
  opts: {
    focusedSpaceId?: string | null;
    /** spaceId → secret available (memory or unwrapped Remember) */
    hasSecret: (spaceId: string) => boolean;
    cap?: number;
  },
): string[] {
  const cap = opts.cap ?? WARM_CAP;
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (id: string | null | undefined) => {
    if (!id || seen.has(id) || !opts.hasSecret(id)) return;
    if (out.length >= cap) return;
    seen.add(id);
    out.push(id);
  };

  push(opts.focusedSpaceId);

  const byActivity = [...rows]
    .filter((r) => !r.muted)
    .sort((a, b) => Math.max(b.lastMessageAt, b.lastOpenedAt) - Math.max(a.lastMessageAt, a.lastOpenedAt));

  for (const row of byActivity) push(row.spaceId);
  return out;
}
