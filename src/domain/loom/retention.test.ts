import { describe, expect, it } from 'vitest';
import { sealEnvelope } from './envelope';
import { createMemoryLoomStore } from './memoryStore';
import {
  hasUnloadableCold,
  messageIdsPastKeepCap,
  pickColdBatch,
  trimSpaceMessages,
} from './retention';
import { ensureSpaceRow } from './spaceIndex';
import { publicSpaceId } from '../crypto/seal';

describe('message keep-last-N retention', () => {
  it('selects oldest ids past the keep cap', async () => {
    const secret = 'ret';
    const a = await sealEnvelope(secret, 'a', 'A', 1, 'id-a');
    const b = await sealEnvelope(secret, 'b', 'B', 2, 'id-b');
    const c = await sealEnvelope(secret, 'c', 'C', 3, 'id-c');
    expect(messageIdsPastKeepCap([a, b, c], 2)).toEqual(['id-a']);
    expect(messageIdsPastKeepCap([a, b, c], 3)).toEqual([]);
  });

  it('moves overflow to cold instead of deleting', async () => {
    const store = createMemoryLoomStore();
    const secret = 'trim-space';
    const spaceId = await publicSpaceId(secret);
    await ensureSpaceRow(store, secret);
    for (let i = 0; i < 5; i++) {
      await store.putMessage(spaceId, await sealEnvelope(secret, `m${i}`, 'Ada', i + 1, `id-${i}`));
    }
    expect(await trimSpaceMessages(store, spaceId, 3)).toBe(2);
    const hot = (await store.listMessages(spaceId)).map((m) => m.id).sort();
    const cold = (await store.listColdMessages(spaceId)).map((m) => m.id).sort();
    expect(hot).toEqual(['id-2', 'id-3', 'id-4']);
    expect(cold).toEqual(['id-0', 'id-1']);
    expect(await store.listMessageIds(spaceId)).toHaveLength(5);
    expect(await hasUnloadableCold(store, spaceId, new Set(hot))).toBe(true);
  });

  it('picks a chronological cold batch older than the cursor', async () => {
    const secret = 'batch';
    const msgs = [];
    for (let i = 0; i < 5; i++) {
      msgs.push(await sealEnvelope(secret, `m${i}`, 'Ada', i + 1, `id-${i}`));
    }
    const batch = pickColdBatch(
      msgs.map((m) => ({ ...m, spaceId: 's' })),
      { ts: 4, id: 'id-3' },
      new Set(),
      2,
    );
    expect(batch.map((m) => m.id)).toEqual(['id-1', 'id-2']);
  });
});
