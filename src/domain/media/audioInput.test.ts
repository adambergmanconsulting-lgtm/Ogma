import { describe, expect, it } from 'vitest';
import { isAudioInputOff } from './audioInput';

function track(partial: Partial<MediaStreamTrack> & Pick<MediaStreamTrack, 'readyState'>): MediaStreamTrack {
  return {
    kind: 'audio',
    enabled: true,
    muted: false,
    ...partial,
  } as MediaStreamTrack;
}

function streamWith(...tracks: MediaStreamTrack[]): MediaStream {
  return {
    getAudioTracks: () => tracks.filter((t) => t.kind === 'audio'),
  } as MediaStream;
}

describe('isAudioInputOff', () => {
  it('is off when stream is null', () => {
    expect(isAudioInputOff(null)).toBe(true);
  });

  it('is off when there are no live audio tracks', () => {
    expect(isAudioInputOff(streamWith())).toBe(true);
    expect(isAudioInputOff(streamWith(track({ readyState: 'ended' })))).toBe(true);
  });

  it('is on when a live enabled unmuted audio track exists', () => {
    expect(isAudioInputOff(streamWith(track({ readyState: 'live' })))).toBe(false);
  });

  it('is off when every live audio track is disabled or muted', () => {
    expect(isAudioInputOff(streamWith(track({ readyState: 'live', enabled: false })))).toBe(true);
    expect(isAudioInputOff(streamWith(track({ readyState: 'live', muted: true })))).toBe(true);
  });
});
