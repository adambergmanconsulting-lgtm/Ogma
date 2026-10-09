import { describe, expect, it } from 'vitest';
import {
  activeSpeakerIds,
  computeWantVideoFrom,
  shouldSendVideoToPeer,
} from './subscribe';

describe('subscribe', () => {
  it('picks recent speakers and pins', () => {
    const now = 10_000;
    const speaking = new Map([
      ['a', { level: 0.5, ts: now - 100 }],
      ['b', { level: 0.01, ts: now - 100 }],
      ['c', { level: 0.9, ts: now - 10_000 }],
    ]);
    expect(activeSpeakerIds(speaking, now)).toEqual(['a']);
    expect(
      computeWantVideoFrom({
        remotePeerIds: ['a', 'b', 'c'],
        pins: ['c'],
        speaking,
        showAll: false,
        now,
      }).sort(),
    ).toEqual(['a', 'c']);
  });

  it('showAll returns every remote', () => {
    expect(
      computeWantVideoFrom({
        remotePeerIds: ['a', 'b'],
        pins: [],
        speaking: new Map(),
        showAll: true,
      }),
    ).toEqual(['a', 'b']);
  });

  it('shouldSendVideoToPeer respects want list', () => {
    expect(shouldSendVideoToPeer('me', { wantVideoFrom: ['me'], showAll: false })).toBe(true);
    expect(shouldSendVideoToPeer('me', { wantVideoFrom: ['other'], showAll: false })).toBe(false);
    expect(shouldSendVideoToPeer('me', { wantVideoFrom: [], showAll: true })).toBe(true);
  });
});
