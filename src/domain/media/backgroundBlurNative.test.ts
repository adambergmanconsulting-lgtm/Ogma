import { describe, expect, it, vi } from 'vitest';
import {
  canControlNativeBackgroundBlur,
  setNativeBackgroundBlur,
} from './backgroundBlurNative';

describe('canControlNativeBackgroundBlur', () => {
  it('requires a two-value backgroundBlur capability', () => {
    const track = {
      kind: 'video',
      getCapabilities: () => ({ backgroundBlur: [true, false] }),
    } as unknown as MediaStreamTrack;
    expect(canControlNativeBackgroundBlur(track)).toBe(true);

    const readOnly = {
      kind: 'video',
      getCapabilities: () => ({ backgroundBlur: [true] }),
    } as unknown as MediaStreamTrack;
    expect(canControlNativeBackgroundBlur(readOnly)).toBe(false);
  });
});

describe('setNativeBackgroundBlur', () => {
  it('applies constraints when controllable', async () => {
    let on = false;
    const track = {
      kind: 'video',
      getCapabilities: () => ({ backgroundBlur: [true, false] }),
      getSettings: () => ({ backgroundBlur: on }),
      applyConstraints: vi.fn(async (c: { backgroundBlur: boolean }) => {
        on = c.backgroundBlur;
      }),
    } as unknown as MediaStreamTrack;

    await expect(setNativeBackgroundBlur(track, true)).resolves.toBe(true);
    expect(track.applyConstraints).toHaveBeenCalledWith({ backgroundBlur: true });
  });
});
