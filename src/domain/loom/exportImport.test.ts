import { describe, expect, it } from 'vitest';
import { sealEnvelope } from './envelope';
import { buildBackup, importBackup, parseBackupJson } from './exportImport';
import { createMemoryLoomStore } from './memoryStore';
import { ensureSpaceRow } from './spaceIndex';
import { publicSpaceId } from '../crypto/seal';

describe('export/import', () => {
  it('round-trips sealed history', async () => {
    const store = createMemoryLoomStore();
    const secret = 'move-me';
    const spaceId = await publicSpaceId(secret);
    await ensureSpaceRow(store, secret);
    const env = await sealEnvelope(secret, 'keep', 'Bo');
    await store.putMessage(spaceId, env);

    const backup = await buildBackup(store);
    const json = JSON.stringify(backup);
    const parsed = parseBackupJson(json);

    const other = createMemoryLoomStore();
    const result = await importBackup(other, parsed);
    expect(result.messages).toBe(1);
    expect(await other.getMessage(env.id)).toMatchObject({ id: env.id, spaceId });
    expect(await importBackup(other, parsed)).toMatchObject({ messages: 0 });
  });
});
