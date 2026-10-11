import { describe, expect, it } from 'vitest';
import { createDeviceKeyMeta, unlockDeviceKey } from './deviceKey';
import { createMemoryLoomStore } from './memoryStore';
import { attachPersonId, personIdForName, shortPersonId } from './personKey';

describe('person id', () => {
  it('stays the same public id once the vault has one', async () => {
    const store = createMemoryLoomStore();
    const meta = await createDeviceKeyMeta('vault-pass');
    await store.setDeviceKeyMeta(meta);
    const wrapKey = await unlockDeviceKey('vault-pass', meta);
    const first = await attachPersonId(store, wrapKey, meta);
    const saved = await store.getDeviceKeyMeta();
    expect(saved?.personPublicB64).toBe(first);
    expect(saved?.personPrivateWrappedB64).toBeTruthy();
    expect(first).not.toBe('vault-pass');
    const again = await attachPersonId(store, wrapKey, saved!);
    expect(again).toBe(first);
    expect(shortPersonId(first)).toBe(`${first.slice(0, 4)}…${first.slice(-4)}`);
  });

  it('does not invent an id from a display name', () => {
    expect(shortPersonId('Ada')).toBe('Ada');
    expect(personIdForName('Ada', 'Ada', null)).toBeNull();
    expect(personIdForName('Bo', 'Ada', 'pub-ada')).toBeNull();
    expect(personIdForName(' ada ', 'Ada', 'pub-ada')).toBe('pub-ada');
  });
});
