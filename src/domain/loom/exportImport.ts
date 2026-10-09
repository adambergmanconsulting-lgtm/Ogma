import type { LoomStore } from './storePort';
import type { LoomBackupV1, SpaceIndexRow, StoredMessage } from './types';

export async function buildBackup(store: LoomStore): Promise<LoomBackupV1> {
  const spaces = await store.listSpaces();
  const messages: StoredMessage[] = [];
  for (const space of spaces) {
    messages.push(...(await store.listMessages(space.spaceId)));
    messages.push(...(await store.listColdMessages(space.spaceId)));
  }
  const deviceKeyMeta = await store.getDeviceKeyMeta();
  const backup: LoomBackupV1 = {
    v: 1,
    exportedAt: Date.now(),
    spaces,
    messages,
  };
  if (deviceKeyMeta) backup.deviceKeyMeta = deviceKeyMeta;
  return backup;
}

export function backupToBlob(backup: LoomBackupV1): Blob {
  return new Blob([JSON.stringify(backup)], { type: 'application/json' });
}

export async function downloadBackup(store: LoomStore): Promise<void> {
  const blob = backupToBlob(await buildBackup(store));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ogma-vault-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseBackupJson(raw: string): LoomBackupV1 {
  const parsed = JSON.parse(raw) as LoomBackupV1;
  if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.spaces) || !Array.isArray(parsed.messages)) {
    throw new Error('Invalid backup');
  }
  return parsed;
}

/** Merge backup into store (dedupe messages by id; prefer newer space index timestamps). */
export async function importBackup(store: LoomStore, backup: LoomBackupV1): Promise<{
  spaces: number;
  messages: number;
}> {
  let spaceCount = 0;
  let messageCount = 0;

  for (const incoming of backup.spaces) {
    if (!incoming?.spaceId) continue;
    const existing = await store.getSpace(incoming.spaceId);
    if (!existing) {
      await store.putSpace(normalizeSpace(incoming));
      spaceCount += 1;
    } else {
      await store.putSpace(mergeSpace(existing, incoming));
    }
  }

  const bySpace = new Map<string, StoredMessage[]>();
  for (const msg of backup.messages) {
    if (!msg?.id || !msg.spaceId) continue;
    const list = bySpace.get(msg.spaceId) ?? [];
    list.push(msg);
    bySpace.set(msg.spaceId, list);
  }
  for (const [spaceId, msgs] of bySpace) {
    messageCount += await store.putMessages(
      spaceId,
      msgs.map(({ spaceId: _s, ...env }) => env),
    );
  }

  if (backup.deviceKeyMeta && !(await store.getDeviceKeyMeta())) {
    await store.setDeviceKeyMeta(backup.deviceKeyMeta);
  }

  return { spaces: spaceCount, messages: messageCount };
}

function normalizeSpace(row: SpaceIndexRow): SpaceIndexRow {
  return {
    spaceId: row.spaceId,
    label: row.label,
    authors: Array.isArray(row.authors)
      ? row.authors.filter((a): a is string => typeof a === 'string')
      : undefined,
    status: row.status === 'archived' ? 'archived' : 'recent',
    lastOpenedAt: row.lastOpenedAt || 0,
    lastMessageAt: row.lastMessageAt || 0,
    unreadCount: row.unreadCount || 0,
    muted: row.muted,
    wrappedSecret: row.wrappedSecret,
  };
}

function mergeSpace(existing: SpaceIndexRow, incoming: SpaceIndexRow): SpaceIndexRow {
  const authors = [...(existing.authors ?? [])];
  const seen = new Set(authors.map((a) => a.toLowerCase()));
  for (const a of incoming.authors ?? []) {
    const key = a.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    authors.push(a.trim());
  }
  return {
    ...existing,
    label: existing.label || incoming.label,
    authors: authors.length ? authors : existing.authors,
    status: existing.status === 'archived' && incoming.status === 'archived' ? 'archived' : 'recent',
    lastOpenedAt: Math.max(existing.lastOpenedAt, incoming.lastOpenedAt || 0),
    lastMessageAt: Math.max(existing.lastMessageAt, incoming.lastMessageAt || 0),
    unreadCount: Math.max(existing.unreadCount, incoming.unreadCount || 0),
    wrappedSecret: existing.wrappedSecret || incoming.wrappedSecret,
    muted: existing.muted ?? incoming.muted,
  };
}
