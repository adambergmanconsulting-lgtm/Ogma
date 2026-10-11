import { describe, expect, it } from 'vitest';
import {
  openPayload,
  previewFromPayload,
  sealJoin,
  sealSystemEvent,
  sealTextMessage,
} from './envelope';

describe('loom envelope payloads', () => {
  it('round-trips text, join, and Call/screen system events', async () => {
    const secret = 'env-secret';
    const text = await sealTextMessage(secret, 'hi', 'Ada');
    await expect(openPayload(secret, text)).resolves.toEqual({ kind: 'text', text: 'hi' });
    const join = await sealJoin(secret, 'Bo');
    await expect(openPayload(secret, join)).resolves.toEqual({ kind: 'join' });
    const call = await sealSystemEvent(secret, 'call-start', 'Ada');
    await expect(openPayload(secret, call)).resolves.toEqual({ kind: 'call-start' });
    const screen = await sealSystemEvent(secret, 'screen-share', 'Ada');
    await expect(openPayload(secret, screen)).resolves.toEqual({ kind: 'screen-share' });
  });

  it('builds list previews', () => {
    expect(previewFromPayload('Ada', { kind: 'join' })).toBe('Ada joined');
    expect(previewFromPayload('Ada', { kind: 'call-start' })).toBe('Ada started a call');
    expect(previewFromPayload('Ada', { kind: 'text', text: 'hey' })).toBe('hey');
  });
});
