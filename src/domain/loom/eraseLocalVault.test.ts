import { beforeEach, describe, expect, it } from 'vitest';
import { publicSpaceId } from '../crypto/seal';
import { createDeviceKeyMeta } from './deviceKey';
import { eraseLocalVaultData } from './eraseLocalVault';
import { sealEnvelope } from './envelope';
import { createMemoryLoomStore } from './memoryStore';
import { clearPeopleDirectory, readPeople } from './peopleDirectory';
import { ensureSpaceRow } from './spaceIndex';

const mem = new Map<string, string>();

beforeEach(() => {
  mem.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    },
  });
});

describe('eraseLocalVaultData', () => {
  it('clears spaces, messages, device key, and people', async () => {
    const store = createMemoryLoomStore();
    const secret = 'wipe-me';
    const spaceId = await publicSpaceId(secret);
    await ensureSpaceRow(store, secret);
    const env = await sealEnvelope(secret, 'gone', 'Ada');
    await store.putMessage(spaceId, env);
    await store.setDeviceKeyMeta(await createDeviceKeyMeta('old-key'));
    localStorage.setItem(
      'ogma.people.v1',
      JSON.stringify([
        { name: 'Bo', personPublicB64: 'x', boxPublicB64: 'y', seenAt: 1 },
      ]),
    );

    await eraseLocalVaultData(store);

    expect(await store.listSpaces()).toEqual([]);
    expect(await store.listMessageIds(spaceId)).toEqual([]);
    expect(await store.getDeviceKeyMeta()).toBeNull();
    expect(readPeople()).toHaveLength(0);
  });

  it('clearPeopleDirectory empties known people', () => {
    localStorage.setItem(
      'ogma.people.v1',
      JSON.stringify([
        { name: 'Bo', personPublicB64: 'x', boxPublicB64: 'y', seenAt: 1 },
      ]),
    );
    expect(readPeople()).toHaveLength(1);
    clearPeopleDirectory();
    expect(readPeople()).toHaveLength(0);
  });
});
