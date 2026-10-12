import { describe, expect, it } from 'vitest';
import { cameraTileAspect, cameraTileFrameClass } from './videoTileAspect';

describe('cameraTileAspect', () => {
  it('uses portrait 3:4 for solo and dyad', () => {
    expect(cameraTileAspect(1)).toBe('3/4');
    expect(cameraTileAspect(2)).toBe('3/4');
  });

  it('uses landscape 4:3 for three or more', () => {
    expect(cameraTileAspect(3)).toBe('4/3');
    expect(cameraTileAspect(4)).toBe('4/3');
    expect(cameraTileAspect(6)).toBe('4/3');
  });
});

describe('cameraTileFrameClass', () => {
  it('maps aspect to frame modifiers', () => {
    expect(cameraTileFrameClass('3/4')).toContain('video-tile-frame--portrait');
    expect(cameraTileFrameClass('4/3')).toContain('video-tile-frame--landscape');
  });
});
