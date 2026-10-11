/** Ephemeral Loom call ring (not sealed history). Spec: loom-sync.md */

export const CALL_RING_STALE_MS = 90_000;

export type IncomingCall = {
  spaceId: string;
  spaceSecret: string;
  author: string;
  ts: number;
};

export function isCallRingFresh(ts: number, now = Date.now()): boolean {
  return now - ts <= CALL_RING_STALE_MS;
}

/** Offer Accept when a peer announces Call and we are not already on that Thread. */
export function shouldOfferIncomingCall(opts: {
  author: string;
  ts: number;
  selfName: string;
  alreadyInCall: boolean;
  now?: number;
}): boolean {
  if (opts.alreadyInCall) return false;
  if (!isCallRingFresh(opts.ts, opts.now)) return false;
  const self = opts.selfName.trim();
  if (self && opts.author.trim() === self) return false;
  return Boolean(opts.author.trim());
}
