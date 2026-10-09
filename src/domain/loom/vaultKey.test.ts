import { describe, expect, it } from 'vitest';
import { generateVaultKey } from './vaultKey';

describe('generateVaultKey', () => {
  it('returns url-safe entropy', () => {
    const a = generateVaultKey();
    const b = generateVaultKey();
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThanOrEqual(20);
    expect(a).not.toBe(b);
  });
});
