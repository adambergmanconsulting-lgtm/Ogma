import { describe, expect, it, beforeEach } from 'vitest';
import { clearVault, createVaultRecord, readVault, renameVault, writeVault } from './vault';

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
  clearVault();
});

describe('vault', () => {
  it('requires a name and round-trips', () => {
    expect(() => createVaultRecord('  ', false)).toThrow();
    const rec = createVaultRecord('Ada', true);
    writeVault(rec);
    expect(readVault()).toMatchObject({ displayName: 'Ada', hasDeviceKey: true });
  });

  it('renames the vault', () => {
    writeVault(createVaultRecord('Ada', true));
    expect(renameVault('Bo').displayName).toBe('Bo');
    expect(readVault()?.displayName).toBe('Bo');
  });
});
