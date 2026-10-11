import { beforeEach, describe, expect, it } from 'vitest';
import { createDeviceKeyMeta, unlockDeviceKey } from './deviceKey';
import { createMemoryLoomStore } from './memoryStore';
import { attachPersonId } from './personKey';
import { openSealedForPerson, sealForPerson } from './personBox';
import {
  loadPersonMaterial,
  signHere,
  signPersonCard,
  verifyHere,
  verifyPersonCard,
} from './personCard';
import { cardForName, readAppearActive, readPeople, rememberPersonCard, writeAppearActive } from './peopleDirectory';
import { personRoomKey } from './personPresence';

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

async function material() {
  const store = createMemoryLoomStore();
  const meta = await createDeviceKeyMeta('vault-pass');
  await store.setDeviceKeyMeta(meta);
  const wrapKey = await unlockDeviceKey('vault-pass', meta);
  await attachPersonId(store, wrapKey, meta);
  const saved = await store.getDeviceKeyMeta();
  const keys = await loadPersonMaterial(wrapKey, saved!);
  if (!keys) throw new Error('missing person material');
  return keys;
}

describe('person invite', () => {
  it('seals a space secret to the box key, not the person id', async () => {
    const keys = await material();
    const sealed = await sealForPerson(keys.boxPublicB64, 'space-secret');
    expect(sealed).not.toContain('space-secret');
    expect(await openSealedForPerson(keys.boxPrivate, sealed)).toBe('space-secret');
  });

  it('keeps a signed card and rejects a swapped box key', async () => {
    const keys = await material();
    const card = await signPersonCard(keys, 'Ada');
    expect(await verifyPersonCard(card)).toBe(true);
    expect(await rememberPersonCard(card, 10)).toBe(true);
    expect(cardForName(readPeople(), 'ada')?.personPublicB64).toBe(keys.personPublicB64);
    expect(await rememberPersonCard({ ...card, boxPublicB64: 'other-box' })).toBe(false);
    expect(readPeople()).toHaveLength(1);
  });

  it('accepts a fresh here and rejects a stale one', async () => {
    const keys = await material();
    const here = await signHere(keys, 1_000);
    expect(await verifyHere(keys.personPublicB64, here.ts, here.sigB64, 1_000)).toBe(true);
    expect(await verifyHere(keys.personPublicB64, here.ts, here.sigB64, 90_000)).toBe(false);
  });

  it('derives a stable meeting room from the person id', async () => {
    const keys = await material();
    expect(await personRoomKey(keys.personPublicB64)).toBe(await personRoomKey(keys.personPublicB64));
    expect(await personRoomKey(keys.personPublicB64)).toMatch(/^person:[0-9a-f]{32}$/);
  });

  it('appears active unless turned off', () => {
    expect(readAppearActive()).toBe(true);
    writeAppearActive(false);
    expect(readAppearActive()).toBe(false);
  });
});
