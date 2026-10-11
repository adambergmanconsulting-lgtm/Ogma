import { describe, expect, it, vi } from 'vitest';
import {
  canShareScreen,
  captureScreenTrack,
  isScreenShareCancelled,
  resolveScreenSpotlight,
  screenShareFailure,
  shouldSendLocalVideo,
} from './screenShare';

describe('shouldSendLocalVideo', () => {
  it('keeps sending while the screen replaces an off camera', () => {
    expect(shouldSendLocalVideo(true, false)).toBe(true);
    expect(shouldSendLocalVideo(false, false)).toBe(false);
    expect(shouldSendLocalVideo(false, true)).toBe(true);
  });
});

describe('resolveScreenSpotlight', () => {
  it('features local share over remotes', () => {
    expect(
      resolveScreenSpotlight({
        localScreen: true,
        remotePeers: [{ peerId: 'a', sharingScreen: true }],
      }),
    ).toEqual({ kind: 'local' });
  });

  it('features the first remote sharing a screen', () => {
    expect(
      resolveScreenSpotlight({
        localScreen: false,
        remotePeers: [
          { peerId: 'a' },
          { peerId: 'b', sharingScreen: true },
        ],
      }),
    ).toEqual({ kind: 'remote', peerId: 'b' });
  });

  it('is null when nobody is sharing', () => {
    expect(resolveScreenSpotlight({ localScreen: false, remotePeers: [{ peerId: 'a' }] })).toBeNull();
  });
});

describe('isScreenShareCancelled', () => {
  it('treats a closed picker as a cancel', () => {
    expect(isScreenShareCancelled(new DOMException('no', 'NotAllowedError'))).toBe(true);
    expect(isScreenShareCancelled(new DOMException('no', 'AbortError'))).toBe(true);
    expect(isScreenShareCancelled(new DOMException('no', 'NotFoundError'))).toBe(false);
    expect(isScreenShareCancelled(null)).toBe(false);
  });
});

describe('screenShareFailure', () => {
  it('stays quiet when the picker is closed', () => {
    expect(screenShareFailure(new DOMException('no', 'NotAllowedError'))).toBeNull();
  });

  it('names a browser that cannot capture', () => {
    expect(screenShareFailure(new DOMException('Not supported', 'NotSupportedError'))).toMatch(
      /Chrome or Edge/,
    );
  });
});

describe('captureScreenTrack', () => {
  it('returns the display track and marks it for detail', async () => {
    const video = {
      kind: 'video',
      readyState: 'live',
      contentHint: '',
      stop: vi.fn(),
    };
    const getDisplayMedia = vi.fn(async () => ({
      getVideoTracks: () => [video],
      getTracks: () => [video],
    }));
    vi.stubGlobal('navigator', {
      mediaDevices: { getDisplayMedia },
    });
    try {
      expect(canShareScreen()).toBe(true);
      const track = await captureScreenTrack();
      expect(track).toBe(video);
      expect(video.contentHint).toBe('detail');
      expect(video.stop).not.toHaveBeenCalled();
      expect(getDisplayMedia).toHaveBeenCalledWith({ video: true });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
