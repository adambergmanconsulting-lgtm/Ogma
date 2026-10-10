import { describe, expect, it } from 'vitest';
import { openPayload, previewFromPayload, sealJoin, sealTextMessage } from './envelope';

describe('loom envelope payloads', () => {
  it('round-trips text and join', async () => {
    const secret = 'env-secret';
    const text = await sealTextMessage(secret, 'hi', 'Ada');
    await expect(openPayload(secret, text)).resolves.toEqual({ kind: 'text', text: 'hi' });
    const join = await sealJoin(secret, 'Bo');
    await expect(openPayload(secret, join)).resolves.toEqual({ kind: 'join' });
  });

  it('builds list previews', () => {
    expect(previewFromPayload('Ada', { kind: 'join' })).toBe('Ada joined');
    expect(previewFromPayload('Ada', { kind: 'text', text: 'hey' })).toBe('hey');
  });
});
