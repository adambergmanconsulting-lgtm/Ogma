import { describe, expect, it } from 'vitest';
import { sealEnvelope, compareEnvelopes, openEnvelope } from './envelope';
import { createMemoryLoomStore } from './memoryStore';
import { bumpLastMessage, ensureSpaceRow, partitionSpaces, setSpaceStatus } from './spaceIndex';
import { publicSpaceId } from '../crypto/seal';

describe('loom store + index', () => {
  it('dedupes messages by id and lists by space', async () => {
    const store = createMemoryLoomStore();
    const secret = 'space-a';
    const spaceId = await publicSpaceId(secret);
    await ensureSpaceRow(store, secret);

    const env = await sealEnvelope(secret, 'hello', 'Ada');
    expect(await store.putMessage(spaceId, env)).toBe(true);
    expect(await store.putMessage(spaceId, env)).toBe(false);
    expect(await store.listMessageIds(spaceId)).toEqual([env.id]);
    expect(await openEnvelope(secret, env)).toBe('hello');
  });

  it('orders envelopes by ts then id', async () => {
    const secret = 's';
    const a = await sealEnvelope(secret, 'a', 'A', 100, 'b');
    const b = await sealEnvelope(secret, 'b', 'B', 100, 'a');
    const c = await sealEnvelope(secret, 'c', 'C', 50, 'z');
    const sorted = [a, b, c].sort(compareEnvelopes);
    expect(sorted.map((e) => e.id)).toEqual(['z', 'a', 'b']);
  });

  it('archives and partitions recent vs archived', async () => {
    const store = createMemoryLoomStore();
    const s1 = await ensureSpaceRow(store, 'one', 1000);
    const s2 = await ensureSpaceRow(store, 'two', 2000);
    await bumpLastMessage(store, s1.spaceId, 1500);
    await setSpaceStatus(store, s2.spaceId, 'archived');
    const { recent, archived } = partitionSpaces(await store.listSpaces());
    expect(recent.map((r) => r.spaceId)).toEqual([s1.spaceId]);
    expect(archived.map((r) => r.spaceId)).toEqual([s2.spaceId]);
  });
});
