import { publicSpaceId } from '../crypto/seal';
import type { LoomStore } from './storePort';
import type { SpaceIndexRow, SpaceStatus } from './types';

/** Merge author display names; preserve first-seen order; case-insensitive dedupe. */
export function mergeAuthors(existing: string[] | undefined, incoming: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of [...(existing ?? []), ...incoming]) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/**
 * Default chat title from other participants (excludes self).
 * Returns null when nobody else has spoken yet.
 */
export function formatParticipantLabel(authors: string[], selfName: string): string | null {
  const self = selfName.trim().toLowerCase();
  const others: string[] = [];
  const seen = new Set<string>();
  for (const raw of authors) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (self && key === self) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    others.push(name);
  }
  if (others.length === 0) return null;
  if (others.length <= 3) return others.join(', ');
  return `${others.slice(0, 2).join(', ')} +${others.length - 2}`;
}

/** Human title when nobody else has spoken yet (avoid opaque ids in the list). */
export const ONLY_YOU_LABEL = 'Only you';

export function displaySpaceLabel(row: SpaceIndexRow, selfName = ''): string {
  const custom = row.label?.trim();
  if (custom) return custom;
  return formatParticipantLabel(row.authors ?? [], selfName) || ONLY_YOU_LABEL;
}

/** Fill authors from stored envelopes when the index row never learned them. */
export async function backfillSpaceAuthors(
  store: LoomStore,
  rows: SpaceIndexRow[],
): Promise<void> {
  for (const row of rows) {
    if (row.authors?.length) continue;
    const msgs = await store.listMessages(row.spaceId);
    if (msgs.length === 0) continue;
    await noteSpaceAuthors(
      store,
      row.spaceId,
      msgs.map((m) => m.author),
    );
  }
}

export async function noteSpaceAuthors(
  store: LoomStore,
  spaceId: string,
  incoming: string[],
): Promise<SpaceIndexRow | null> {
  if (incoming.length === 0) return store.getSpace(spaceId);
  const row = await store.getSpace(spaceId);
  if (!row) return null;
  const authors = mergeAuthors(row.authors, incoming);
  if (
    authors.length === (row.authors?.length ?? 0) &&
    authors.every((a, i) => a === row.authors![i])
  ) {
    return row;
  }
  const next = { ...row, authors };
  await store.putSpace(next);
  return next;
}

export function spaceActivityAt(row: Pick<SpaceIndexRow, 'lastMessageAt' | 'lastOpenedAt'>): number {
  return Math.max(row.lastMessageAt || 0, row.lastOpenedAt || 0);
}

export function sortSpacesRecentFirst(rows: SpaceIndexRow[]): SpaceIndexRow[] {
  return [...rows].sort((a, b) => spaceActivityAt(b) - spaceActivityAt(a));
}

/** Muted list timestamp — local, compact (time today; weekday/date otherwise). */
export function formatSpaceActivity(
  at: number,
  now = Date.now(),
  locale?: string,
): string {
  if (!at || at <= 0) return '';
  const d = new Date(at);
  const n = new Date(now);
  const sameDay =
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  }
  const startToday = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (startToday - startThat === dayMs) return 'Yesterday';
  if (d.getFullYear() === n.getFullYear()) {
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function partitionSpaces(rows: SpaceIndexRow[]): {
  recent: SpaceIndexRow[];
  archived: SpaceIndexRow[];
} {
  const sorted = sortSpacesRecentFirst(rows);
  return {
    recent: sorted.filter((r) => r.status === 'recent'),
    archived: sorted.filter((r) => r.status === 'archived'),
  };
}

export async function ensureSpaceRow(
  store: LoomStore,
  spaceSecret: string,
  now = Date.now(),
): Promise<SpaceIndexRow> {
  const spaceId = await publicSpaceId(spaceSecret);
  const existing = await store.getSpace(spaceId);
  if (existing) {
    const next: SpaceIndexRow = {
      ...existing,
      status: 'recent',
      lastOpenedAt: now,
    };
    await store.putSpace(next);
    return next;
  }
  const row: SpaceIndexRow = {
    spaceId,
    status: 'recent',
    lastOpenedAt: now,
    lastMessageAt: now,
    unreadCount: 0,
  };
  await store.putSpace(row);
  return row;
}

export async function setSpaceStatus(
  store: LoomStore,
  spaceId: string,
  status: SpaceStatus,
): Promise<SpaceIndexRow | null> {
  const row = await store.getSpace(spaceId);
  if (!row) return null;
  const next = { ...row, status };
  await store.putSpace(next);
  return next;
}

export async function bumpLastMessage(
  store: LoomStore,
  spaceId: string,
  ts: number,
  unreadDelta = 0,
): Promise<void> {
  const row = await store.getSpace(spaceId);
  if (!row) return;
  await store.putSpace({
    ...row,
    lastMessageAt: Math.max(row.lastMessageAt, ts),
    unreadCount: Math.max(0, row.unreadCount + unreadDelta),
  });
}

export async function clearUnread(store: LoomStore, spaceId: string): Promise<void> {
  const row = await store.getSpace(spaceId);
  if (!row || row.unreadCount === 0) return;
  await store.putSpace({ ...row, unreadCount: 0 });
}
