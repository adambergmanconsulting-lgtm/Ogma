import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearVaultSession,
  readVaultSessionKey,
  writeVaultSessionKey,
} from './vaultSession';

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

describe('vaultSession', () => {
  it('persists until cleared', () => {
    expect(readVaultSessionKey()).toBeNull();
    writeVaultSessionKey('abc');
    expect(readVaultSessionKey()).toBe('abc');
    clearVaultSession();
    expect(readVaultSessionKey()).toBeNull();
  });
});
