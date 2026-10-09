import { describe, expect, it } from 'vitest';
import { buildUserMediaConstraints } from './constraints';

describe('buildUserMediaConstraints', () => {
  it('caps resolution and frame rate for multi-peer mesh', () => {
    const solo = buildUserMediaConstraints({}, 1);
    const crowded = buildUserMediaConstraints({}, 5);

    const soloVideo = solo.video as MediaTrackConstraints;
    const crowdedVideo = crowded.video as MediaTrackConstraints;

    expect((soloVideo.width as ConstrainULongRange).ideal).toBe(1280);
    expect((crowdedVideo.width as ConstrainULongRange).ideal).toBeLessThan(1280);
    expect((crowdedVideo.frameRate as ConstrainDoubleRange).max).toBe(30);
  });

  it('pins exact device ids when provided', () => {
    const constraints = buildUserMediaConstraints({
      videoDeviceId: 'cam-1',
      audioDeviceId: 'mic-1',
    });

    const video = constraints.video as MediaTrackConstraints;
    const audio = constraints.audio as MediaTrackConstraints;
    expect(video.deviceId).toEqual({ exact: 'cam-1' });
    expect(audio.deviceId).toEqual({ exact: 'mic-1' });
  });
});
