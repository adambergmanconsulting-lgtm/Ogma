import { describe, expect, it } from 'vitest';
import {
  classifyPeerStats,
  maxVideoBitrateBps,
  nextLinkQuality,
  normalizeLinkQuality,
  worseLinkQuality,
} from './sendQuality';

describe('maxVideoBitrateBps', () => {
  it('lowers bitrate for larger rooms, low tier, and worse link quality', () => {
    const solo = maxVideoBitrateBps(2, 'high', 'good');
    const crowd = maxVideoBitrateBps(5, 'high', 'good');
    const quiet = maxVideoBitrateBps(5, 'low', 'good');
    const fair = maxVideoBitrateBps(5, 'high', 'fair');
    const poor = maxVideoBitrateBps(5, 'high', 'poor');
    expect(crowd).toBeLessThan(solo);
    expect(quiet).toBeLessThan(crowd);
    expect(fair).toBeLessThan(crowd);
    expect(poor).toBeLessThan(fair);
    expect(poor).toBeGreaterThanOrEqual(80_000);
  });

  it('accepts legacy congested boolean', () => {
    expect(maxVideoBitrateBps(2, 'high', true)).toBe(maxVideoBitrateBps(2, 'high', 'fair'));
  });
});

describe('normalizeLinkQuality / worseLinkQuality', () => {
  it('maps boolean and picks worse', () => {
    expect(normalizeLinkQuality(true)).toBe('fair');
    expect(normalizeLinkQuality(false)).toBe('good');
    expect(worseLinkQuality('fair', 'poor')).toBe('poor');
    expect(worseLinkQuality('good', 'fair')).toBe('fair');
  });
});

describe('nextLinkQuality', () => {
  it('escalates immediately and recovers after two better windows', () => {
    expect(nextLinkQuality('good', 'poor', 0)).toEqual({ quality: 'poor', goodStreak: 0 });
    expect(nextLinkQuality('poor', 'good', 0)).toEqual({ quality: 'poor', goodStreak: 1 });
    expect(nextLinkQuality('poor', 'good', 1)).toEqual({ quality: 'fair', goodStreak: 0 });
    expect(nextLinkQuality('fair', 'good', 1)).toEqual({ quality: 'good', goodStreak: 0 });
  });
});

describe('classifyPeerStats', () => {
  it('returns good with little loss and low RTT', () => {
    expect(
      classifyPeerStats([
        { type: 'outbound-rtp', kind: 'video', packetsLost: 1, packetsSent: 200 },
        { type: 'remote-inbound-rtp', kind: 'video', roundTripTime: 0.05 },
      ]),
    ).toBe('good');
  });

  it('returns fair / poor from loss or RTT thresholds', () => {
    expect(
      classifyPeerStats([
        { type: 'outbound-rtp', kind: 'video', packetsLost: 10, packetsSent: 200 },
      ]),
    ).toBe('fair');
    expect(
      classifyPeerStats([
        { type: 'outbound-rtp', kind: 'video', packetsLost: 20, packetsSent: 200 },
      ]),
    ).toBe('poor');
    expect(
      classifyPeerStats([
        { type: 'outbound-rtp', kind: 'video', packetsLost: 0, packetsSent: 200 },
        { type: 'remote-inbound-rtp', kind: 'video', roundTripTime: 0.4 },
      ]),
    ).toBe('fair');
    expect(
      classifyPeerStats([
        { type: 'inbound-rtp', kind: 'video', packetsLost: 30, packetsReceived: 200 },
      ]),
    ).toBe('poor');
  });
});
