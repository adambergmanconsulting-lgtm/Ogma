import { afterEach, describe, expect, it, vi } from 'vitest';

describe('playTestTone', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('rejects when AudioContext is unavailable', async () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);
    const { playTestTone } = await import('./testTone');
    await expect(playTestTone()).rejects.toThrow(/not supported/i);
  });
});
