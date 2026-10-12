/**
 * Camera tile target aspect in the people grid (not screen share).
 * Dyad / solo lean portrait for head-and-shoulders; 3+ lean classic 4:3.
 */
export type CameraTileAspect = '3/4' | '4/3';

/** Participant count = local + remotes shown in the people grid. */
export function cameraTileAspect(participantCount: number): CameraTileAspect {
  return participantCount <= 2 ? '3/4' : '4/3';
}

/** CSS class for a frame that fits the largest matching rectangle in its cell. */
export function cameraTileFrameClass(aspect: CameraTileAspect): string {
  return aspect === '3/4' ? 'video-tile-frame video-tile-frame--portrait' : 'video-tile-frame video-tile-frame--landscape';
}
