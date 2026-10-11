import { publicSpaceId } from '../crypto/seal';
import type { LoomStore } from './storePort';
import type { SpaceIndexRow, SpaceStatus } from './types';

const DEFAULT_SPACE_LABEL = 'Chat';
const PREVIEW_MAX = 80;

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

/** First whitespace token for chrome chips; full name when already one token. */
export function shortDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  const token = trimmed.split(/\s+/)[0] ?? trimmed;
  return token;
}

/** Clamp list preview text. */
export function clipSpacePreview(text: string, max = PREVIEW_MAX): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Spaces list label: custom label → last preview → Chat.
 * Open chat uses the people row + join lines instead of this string.
 */
export function displaySpaceLabel(row: SpaceIndexRow, _selfName = ''): string {
  const custom = row.label?.trim();
  if (custom) return custom;
  const preview = row.lastPreview?.trim();
  if (preview) return preview;
  return DEFAULT_SPACE_LABEL;
}

/** People known in this space for the open-chat row (includes self). */
export function spacePeopleNames(authors: string[] | undefined, selfName: string): string[] {
  return mergeAuthors(authors, selfName.trim() ? [selfName.trim()] : []);
}

/**
 * Open chat is alone and has no text yet — creating another space would only stack empties.
 * `people` is the display list (may include self).
 */
export function isFreshSoloChat(
  people: string[],
  selfName: string,
  hasTextMessage: boolean,
): boolean {
  if (hasTextMessage) return false;
  const self = selfName.trim().toLowerCase();
  return !people.some((p) => {
    const name = p.trim().toLowerCase();
    return Boolean(name) && name !== self;
  });
}

/** Case-insensitive Spaces search over label, preview, and author names. */
export function spaceMatchesQuery(
  row: SpaceIndexRow,
  query: string,
  selfName = '',
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const label = displaySpaceLabel(row, selfName).toLowerCase();
  if (label.includes(q)) return true;
  if (row.label?.toLowerCase().includes(q)) return true;
  if (row.lastPreview?.toLowerCase().includes(q)) return true;
  for (const author of row.authors ?? []) {
    if (author.toLowerCase().includes(q)) return true;
  }
  return false;
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
  lastPreview?: string,
): Promise<void> {
  const row = await store.getSpace(spaceId);
  if (!row) return;
  const preview = lastPreview?.trim();
  // Only replace list preview when this tip is at least as new as known activity.
  const tipIsNewest = Boolean(preview) && ts >= (row.lastMessageAt || 0);
  await store.putSpace({
    ...row,
    lastMessageAt: Math.max(row.lastMessageAt, ts),
    unreadCount: Math.max(0, row.unreadCount + unreadDelta),
    ...(tipIsNewest && preview ? { lastPreview: clipSpacePreview(preview) } : {}),
  });
}

export async function clearUnread(store: LoomStore, spaceId: string): Promise<void> {
  const row = await store.getSpace(spaceId);
  if (!row || row.unreadCount === 0) return;
  await store.putSpace({ ...row, unreadCount: 0 });
}
