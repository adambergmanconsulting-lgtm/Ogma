import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readVault } from '../domain/loom/vault';
import type { LoomStore } from '../domain/loom/storePort';

vi.mock('../domain/loom/eraseLocalVault', () => ({
  eraseLocalVaultData: vi.fn(async () => {}),
}));

vi.mock('../domain/signaling/room', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../domain/signaling/room')>();
  return { ...mod, clearCapabilityFromUrl: vi.fn() };
});

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => {
      map.delete(k);
    },
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

describe('loomVaultBootstrap', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: memoryStorage(),
    });
    vi.clearAllMocks();
  });

  it('bootstraps a name-only vault without a device key', async () => {
    const { bootstrapNameOnlyVault } = await import('./loomVaultBootstrap');
    const store = {} as LoomStore;
    const rec = await bootstrapNameOnlyVault(store, 'Ada');
    expect(rec.hasDeviceKey).toBe(false);
    expect(rec.displayName).toBe('Ada');
    expect(readVault()).toEqual(rec);
    expect(localStorage.getItem('ogma.displayName')).toBe('Ada');
  });
});
