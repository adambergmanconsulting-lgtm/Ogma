import { describe, expect, it } from 'vitest';
import { openPayload, openText, publicSpaceId, sealPayload, sealText } from './seal';

describe('seal/open', () => {
  it('round-trips text with space secret', async () => {
    const secret = 'test-space-secret-not-for-prod';
    const sealed = await sealText(secret, 'golden threads');
    const plain = await openText(secret, sealed.nonce, sealed.ciphertext);
    expect(plain).toBe('golden threads');
  });

  it('round-trips join and Call system payloads', async () => {
    const secret = 'join-space';
    const sealed = await sealPayload(secret, { kind: 'join' });
    await expect(openPayload(secret, sealed.nonce, sealed.ciphertext)).resolves.toEqual({
      kind: 'join',
    });
    const call = await sealPayload(secret, { kind: 'call-end' });
    await expect(openPayload(secret, call.nonce, call.ciphertext)).resolves.toEqual({
      kind: 'call-end',
    });
  });

  it('openPayload returns text kind for sealed text', async () => {
    const secret = 'legacy';
    const sealed = await sealText(secret, 'hi');
    await expect(openPayload(secret, sealed.nonce, sealed.ciphertext)).resolves.toEqual({
      kind: 'text',
      text: 'hi',
    });
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
