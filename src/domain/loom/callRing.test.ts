import { describe, expect, it } from 'vitest';
import { isCallRingFresh, shouldOfferIncomingCall, CALL_RING_STALE_MS } from './callRing';

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

  it('skips self, in-call, and empty author', () => {
    expect(
      shouldOfferIncomingCall({
        author: 'Bob',
        ts: 100,
        selfName: 'Bob',
        alreadyInCall: false,
        now: 100,
      }),
    ).toBe(false);
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
});
