import { describe, expect, it, vi } from 'vitest';
import { buildPublishStream, setVideoTracksEnabled } from './publishStream';

function fakeTrack(kind: 'audio' | 'video', id: string): MediaStreamTrack {
  return {
    kind,
    id,
    enabled: true,
    stop: vi.fn(),
  } as unknown as MediaStreamTrack;
}

describe('buildPublishStream', () => {
  it('returns the camera stream when blur is off', () => {
    const camera = {
      getAudioTracks: () => [fakeTrack('audio', 'a1')],
      getVideoTracks: () => [fakeTrack('video', 'v1')],
    } as unknown as MediaStream;
    expect(buildPublishStream(camera, null)).toBe(camera);
  });

  it('keeps camera audio and swaps in the processed video track', () => {
    const audio = fakeTrack('audio', 'a1');
    const cameraVideo = fakeTrack('video', 'cam');
    const blurVideo = fakeTrack('video', 'blur');
    const camera = {
      getAudioTracks: () => [audio],
      getVideoTracks: () => [cameraVideo],
    } as unknown as MediaStream;

    const Original = globalThis.MediaStream;
    class FakeMediaStream {
      tracks: MediaStreamTrack[];
      constructor(tracks: MediaStreamTrack[]) {
        this.tracks = tracks;
      }
      getTracks() {
        return this.tracks;
      }
      getAudioTracks() {
        return this.tracks.filter((t) => t.kind === 'audio');
      }
      getVideoTracks() {
        return this.tracks.filter((t) => t.kind === 'video');
      }
    }
    globalThis.MediaStream = FakeMediaStream as unknown as typeof MediaStream;
    try {
      const published = buildPublishStream(camera, blurVideo);
      expect(published.getVideoTracks().map((t) => t.id)).toEqual(['blur']);
      expect(published.getAudioTracks().map((t) => t.id)).toEqual(['a1']);
      expect(cameraVideo.stop).not.toHaveBeenCalled();
    } finally {
      globalThis.MediaStream = Original;
    }
  });
});

describe('setVideoTracksEnabled', () => {
  it('toggles every listed stream video track', () => {
    const a = fakeTrack('video', 'a');
    const b = fakeTrack('video', 'b');
    setVideoTracksEnabled(
      [
        { getVideoTracks: () => [a] } as unknown as MediaStream,
        { getVideoTracks: () => [b] } as unknown as MediaStream,
      ],
      false,
    );
    expect(a.enabled).toBe(false);
    expect(b.enabled).toBe(false);
  });
});
