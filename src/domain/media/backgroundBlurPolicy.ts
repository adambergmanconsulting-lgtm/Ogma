import type { SendQualityTier } from './constraints';

export type BackgroundBlurPressure = {
  peerCount: number;
  congested: boolean;
  qualityTier: SendQualityTier;
};

/**
 * Yield software blur when mesh/CPU pressure is high.
 * Phones and larger free-path rooms come first (overview Planned).
 */
export function shouldYieldBackgroundBlur(p: BackgroundBlurPressure): boolean {
  if (p.congested) return true;
  if (p.peerCount >= 5) return true;
  if (p.qualityTier === 'low' && p.peerCount >= 3) return true;
  return false;
}

/** Soft FPS for the canvas pipeline under room pressure. */
export function backgroundBlurTargetFps(p: BackgroundBlurPressure): number {
  if (p.peerCount <= 2 && !p.congested && p.qualityTier === 'high') return 24;
  if (p.peerCount <= 4 && !p.congested) return 15;
  return 10;
}

/** Privacy-strength radius — room detail should not read as a real place. */
export function backgroundBlurRadiusPx(p: BackgroundBlurPressure): number {
  if (p.peerCount <= 2 && p.qualityTier === 'high') return 28;
  return 18;
}

/** How much of the blurred camera wash sits over the soft slate fill (0–1). */
export function backgroundBlurWashOpacity(p: BackgroundBlurPressure): number {
  if (p.peerCount <= 2 && p.qualityTier === 'high') return 0.38;
  return 0.28;
}
