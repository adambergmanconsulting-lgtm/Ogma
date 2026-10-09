import { describe, expect, it } from 'vitest';
import { maxVideoBitrateBps } from './sendQuality';

describe('maxVideoBitrateBps', () => {
  it('lowers bitrate for larger rooms, low tier, and congestion', () => {
    const solo = maxVideoBitrateBps(2, 'high', false);
    const crowd = maxVideoBitrateBps(5, 'high', false);
    const quiet = maxVideoBitrateBps(5, 'low', false);
    const congested = maxVideoBitrateBps(5, 'high', true);
    expect(crowd).toBeLessThan(solo);
    expect(quiet).toBeLessThan(crowd);
    expect(congested).toBeLessThan(crowd);
  });
});
