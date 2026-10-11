/** Ephemeral Loom call ring (not sealed history). Spec: loom-sync.md */

export const CALL_RING_STALE_MS = 90_000;

export type IncomingCall = {
  spaceId: string;
  spaceSecret: string;
  /** Precomputed Thread room so Accept can start media under the click gesture. */
  roomId: string;
  author: string;
  ts: number;
};

export function isCallRingFresh(ts: number, now = Date.now()): boolean {
  return now - ts <= CALL_RING_STALE_MS;
}

/**
 * Offer Accept when a peer announces Call and we are not already on that Thread.
 * Do not filter by matching display name — two people often share a label; the
 * caller suppresses echo via markCalling before announce.
 */
export function shouldOfferIncomingCall(opts: {
  author: string;
  ts: number;
  /** Kept for callers; not used to suppress (names are not unique). */
  selfName: string;
  alreadyInCall: boolean;
  now?: number;
}): boolean {
  if (opts.alreadyInCall) return false;
  if (!isCallRingFresh(opts.ts, opts.now)) return false;
  return Boolean(opts.author.trim());
}

/**
 * Start-Call chrome shares one path with Accept: while a ring is offered,
 * do not also show Call (parallel CTAs). Call handlers may still Accept.
 */
export function shouldOfferStartCall(opts: {
  inCall: boolean;
  hasIncomingCall: boolean;
}): boolean {
  return !opts.inCall && !opts.hasIncomingCall;
}

/**
 * Loom `{ type: "call-end" }` ends the Call for that space — hang up locally
 * when we are in that Call (not only when Accept was still showing).
 */
export function shouldEndLocalCallOnWire(opts: {
  endedSpaceId: string;
  inCall: boolean;
  callingSpaceId: string | null;
  boundSpaceId: string | null;
}): boolean {
  if (!opts.inCall) return false;
  if (opts.callingSpaceId === opts.endedSpaceId) return true;
  return opts.boundSpaceId === opts.endedSpaceId;
}
