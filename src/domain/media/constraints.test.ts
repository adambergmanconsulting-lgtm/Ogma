import { describe, expect, it } from 'vitest';
import { buildUserMediaConstraints } from './constraints';

describe('buildUserMediaConstraints', () => {
  it('keeps high soft ceiling on healthy small rooms', () => {
    const solo = buildUserMediaConstraints({}, 2, { tier: 'high', congested: false });
    const video = solo.video as MediaTrackConstraints;
    expect((video.width as ConstrainULongRange).ideal).toBe(1280);
    expect((video.frameRate as ConstrainDoubleRange).ideal).toBe(30);
  });

  it('drops ideal width/fps for crowded or congested calls', () => {
    const crowded = buildUserMediaConstraints({}, 5, { tier: 'high', congested: false });
    const congested = buildUserMediaConstraints({}, 3, { tier: 'high', congested: true });
    const low = buildUserMediaConstraints({}, 3, { tier: 'low', congested: false });

    const crowdedW = (crowded.video as MediaTrackConstraints).width as ConstrainULongRange;
    const congestedW = (congested.video as MediaTrackConstraints).width as ConstrainULongRange;
    const lowW = (low.video as MediaTrackConstraints).width as ConstrainULongRange;

    expect(crowdedW.ideal).toBeLessThan(1280);
    expect(congestedW.ideal).toBeLessThanOrEqual(640);
    expect(lowW.ideal).toBeLessThanOrEqual(640);
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
