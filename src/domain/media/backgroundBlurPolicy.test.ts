import { describe, expect, it } from 'vitest';
import {
  backgroundBlurRadiusPx,
  backgroundBlurTargetFps,
  backgroundBlurWashOpacity,
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

describe('backgroundBlurRadiusPx', () => {
  it('uses privacy-strength blur on a healthy 1:1 call', () => {
    expect(
      backgroundBlurRadiusPx({ peerCount: 2, congested: false, qualityTier: 'high' }),
    ).toBeGreaterThanOrEqual(24);
  });

  it('keeps a strong radius under mild pressure', () => {
    expect(
      backgroundBlurRadiusPx({ peerCount: 3, congested: false, qualityTier: 'low' }),
    ).toBeGreaterThanOrEqual(16);
  });
});

describe('backgroundBlurWashOpacity', () => {
  it('keeps the camera wash subordinate to the soft fill', () => {
    const healthy = backgroundBlurWashOpacity({
      peerCount: 2,
      congested: false,
      qualityTier: 'high',
    });
    const pressured = backgroundBlurWashOpacity({
      peerCount: 4,
      congested: false,
      qualityTier: 'low',
    });
    expect(healthy).toBeLessThan(0.5);
    expect(pressured).toBeLessThanOrEqual(healthy);
  });
});
