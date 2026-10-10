import { describe, expect, it } from 'vitest';
import { createDeviceKeyMeta, unlockDeviceKey } from './deviceKey';
import { createMemoryLoomStore } from './memoryStore';
import {
  hydrateLocalSecrets,
  persistSpaceSecret,
  secretFromSpaceRow,
  wrapStoredSpaceSecrets,
} from './spaceSecretAccess';
import type { SpaceIndexRow } from './types';

function row(partial: Partial<SpaceIndexRow> & { spaceId: string }): SpaceIndexRow {
  return {
    status: 'recent',
    lastOpenedAt: 1,
    lastMessageAt: 1,
    unreadCount: 0,
    ...partial,
  };
}

describe('spaceSecretAccess', () => {
  it('reads memory then localSecret', () => {
    const memory = new Map([['a', 'from-mem']]);
    expect(secretFromSpaceRow('a', row({ spaceId: 'a', localSecret: 'local' }), memory)).toBe(
      'from-mem',
    );
    expect(secretFromSpaceRow('b', row({ spaceId: 'b', localSecret: 'local' }), memory)).toBe(
      'local',
    );
    expect(secretFromSpaceRow('c', row({ spaceId: 'c' }), memory)).toBeNull();
  });

  it('persists localSecret without vault wrap key', async () => {
    const store = createMemoryLoomStore();
    const base = row({ spaceId: 's1' });
    await store.putSpace(base);
    const next = await persistSpaceSecret(store, base, 'invite-secret', null);
    expect(next.localSecret).toBe('invite-secret');
    expect(next.wrappedSecret).toBeUndefined();
    expect((await store.getSpace('s1'))?.localSecret).toBe('invite-secret');
  });

  it('wraps and clears localSecret when vault key exists', async () => {
    const store = createMemoryLoomStore();
    const meta = await createDeviceKeyMeta('pass');
    const key = await unlockDeviceKey('pass', meta);
    const base = row({ spaceId: 's1', localSecret: 'invite-secret' });
    await store.putSpace(base);
    const next = await persistSpaceSecret(store, base, 'invite-secret', key);
    expect(next.localSecret).toBeUndefined();
    expect(next.wrappedSecret).toBeTruthy();
  });

  it('hydrates memory from localSecret rows', () => {
    const into = new Map<string, string>();
    hydrateLocalSecrets(
      [row({ spaceId: 'a', localSecret: 'one' }), row({ spaceId: 'b' })],
      into,
    );
    expect(into.get('a')).toBe('one');
    expect(into.has('b')).toBe(false);
  });

  it('wrapStoredSpaceSecrets migrates locals into wrapped', async () => {
    const store = createMemoryLoomStore();
    const meta = await createDeviceKeyMeta('pass');
    const key = await unlockDeviceKey('pass', meta);
    await store.putSpace(row({ spaceId: 's1', localSecret: 'invite' }));
    const memory = new Map<string, string>();
    await wrapStoredSpaceSecrets(key, store, await store.listSpaces(), memory);
    const saved = await store.getSpace('s1');
    expect(saved?.localSecret).toBeUndefined();
    expect(saved?.wrappedSecret).toBeTruthy();
    expect(memory.get('s1')).toBe('invite');
  });
});
