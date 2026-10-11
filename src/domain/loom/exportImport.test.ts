import { describe, expect, it } from 'vitest';
import { publicSpaceId } from '../crypto/seal';
import { createDeviceKeyMeta, unlockDeviceKey, wrapSpaceSecret } from './deviceKey';
import { sealEnvelope } from './envelope';
import { buildBackup, importBackup, parseBackupJson } from './exportImport';
import { createMemoryLoomStore } from './memoryStore';
import { ensureSpaceRow } from './spaceIndex';

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

  it('export with wrapKey writes localSecret so another vault can open chats', async () => {
    const store = createMemoryLoomStore();
    const secret = 'portable-invite';
    const spaceId = await publicSpaceId(secret);
    await ensureSpaceRow(store, secret);
    const meta = await createDeviceKeyMeta('test-vault-key');
    await store.setDeviceKeyMeta(meta);
    const wrapKey = await unlockDeviceKey('test-vault-key', meta);
    const wrapped = await wrapSpaceSecret(wrapKey, secret);
    const row = { ...(await store.getSpace(spaceId))!, wrappedSecret: wrapped };
    delete row.localSecret;
    await store.putSpace(row);

    const backup = await buildBackup(store, wrapKey);
    const exported = backup.spaces.find((s) => s.spaceId === spaceId);
    expect(exported?.localSecret).toBe(secret);
  });
});
