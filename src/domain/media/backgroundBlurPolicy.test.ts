import { describe, expect, it } from 'vitest';
import {
  backgroundBlurTargetFps,
  shouldYieldBackgroundBlur,
} from './backgroundBlurPolicy';

describe('shouldYieldBackgroundBlur', () => {
  it('allows blur on a healthy 1:1 call', () => {
    expect(
      shouldYieldBackgroundBlur({ peerCount: 2, congested: false, qualityTier: 'high' }),
    ).toBe(false);
  });

  it('yields when congested, crowded, or low-tier mid-size', () => {
    expect(
      shouldYieldBackgroundBlur({ peerCount: 2, congested: true, qualityTier: 'high' }),
    ).toBe(true);
    expect(
      shouldYieldBackgroundBlur({ peerCount: 5, congested: false, qualityTier: 'high' }),
    ).toBe(true);
    expect(
      shouldYieldBackgroundBlur({ peerCount: 3, congested: false, qualityTier: 'low' }),
    ).toBe(true);
  });
});

describe('backgroundBlurTargetFps', () => {
  it('drops fps as room pressure rises', () => {
    const solo = backgroundBlurTargetFps({
      peerCount: 2,
      congested: false,
      qualityTier: 'high',
    });
    const crowded = backgroundBlurTargetFps({
      peerCount: 5,
      congested: true,
      qualityTier: 'low',
    });
    expect(solo).toBeGreaterThan(crowded);
  });
});
