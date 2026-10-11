import { describe, expect, it } from 'vitest';
import {
  isCallRingFresh,
  shouldEndLocalCallOnWire,
  shouldOfferIncomingCall,
  shouldOfferStartCall,
  CALL_RING_STALE_MS,
} from './callRing';

describe('callRing', () => {
  it('rejects stale rings', () => {
    const now = 1_000_000;
    expect(isCallRingFresh(now - CALL_RING_STALE_MS + 1, now)).toBe(true);
    expect(isCallRingFresh(now - CALL_RING_STALE_MS - 1, now)).toBe(false);
  });

  it('offers Accept for a fresh peer announce', () => {
    expect(
      shouldOfferIncomingCall({
        author: 'Ada',
        ts: 100,
        selfName: 'Bob',
        alreadyInCall: false,
        now: 100,
      }),
    ).toBe(true);
  });

  it('offers when names match (labels are not unique)', () => {
    expect(
      shouldOfferIncomingCall({
        author: 'Bob',
        ts: 100,
        selfName: 'Bob',
        alreadyInCall: false,
        now: 100,
      }),
    ).toBe(true);
  });

  it('skips in-call and empty author', () => {
    expect(
      shouldOfferIncomingCall({
        author: 'Ada',
        ts: 100,
        selfName: 'Bob',
        alreadyInCall: true,
        now: 100,
      }),
    ).toBe(false);
    expect(
      shouldOfferIncomingCall({
        author: '  ',
        ts: 100,
        selfName: 'Bob',
        alreadyInCall: false,
        now: 100,
      }),
    ).toBe(false);
  });

  it('hides Start Call while Accept is offered', () => {
    expect(shouldOfferStartCall({ inCall: false, hasIncomingCall: false })).toBe(true);
    expect(shouldOfferStartCall({ inCall: false, hasIncomingCall: true })).toBe(false);
    expect(shouldOfferStartCall({ inCall: true, hasIncomingCall: false })).toBe(false);
  });

  it('ends a live Call when call-end matches calling or bound space', () => {
    expect(
      shouldEndLocalCallOnWire({
        endedSpaceId: 's1',
        inCall: true,
        callingSpaceId: 's1',
        boundSpaceId: null,
      }),
    ).toBe(true);
    expect(
      shouldEndLocalCallOnWire({
        endedSpaceId: 's1',
        inCall: true,
        callingSpaceId: null,
        boundSpaceId: 's1',
      }),
    ).toBe(true);
    expect(
      shouldEndLocalCallOnWire({
        endedSpaceId: 's1',
        inCall: true,
        callingSpaceId: 'other',
        boundSpaceId: 'other',
      }),
    ).toBe(false);
    expect(
      shouldEndLocalCallOnWire({
        endedSpaceId: 's1',
        inCall: false,
        callingSpaceId: 's1',
        boundSpaceId: 's1',
      }),
    ).toBe(false);
  });
});
