import { describe, expect, it } from 'vitest';
import { openText, publicSpaceId, sealText } from './seal';

describe('seal/open', () => {
  it('round-trips text with space secret', async () => {
    const secret = 'test-space-secret-not-for-prod';
    const sealed = await sealText(secret, 'golden threads');
    const plain = await openText(secret, sealed.nonce, sealed.ciphertext);
    expect(plain).toBe('golden threads');
  });

  it('fails with wrong secret', async () => {
    const sealed = await sealText('a', 'hi');
    await expect(openText('b', sealed.nonce, sealed.ciphertext)).rejects.toThrow();
  });

  it('derives stable public space id', async () => {
    const a = await publicSpaceId('same');
    const b = await publicSpaceId('same');
    const c = await publicSpaceId('other');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[a-f0-9]{32}$/);
  });
});
