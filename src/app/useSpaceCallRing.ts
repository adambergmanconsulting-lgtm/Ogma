import { useCallback, useRef, useState } from 'react';
import {
  shouldOfferIncomingCall,
  type IncomingCall,
} from '../domain/loom/callRing';
import { playNewMessageSound } from '../domain/loom/notifySound';

/**
 * Ephemeral Call ring over Loom sync: announce when we start A/V, offer Accept to peers.
 */
export function useSpaceCallRing(opts: {
  displayName: string;
  /** True while this tab is already in a Thread call. */
  inCall: boolean;
  spaceSecret: (spaceId: string) => string | undefined;
}) {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [callingSpaceId, setCallingSpaceId] = useState<string | null>(null);
  const callingIdsRef = useRef(new Set<string>());
  const displayNameRef = useRef(opts.displayName);
  displayNameRef.current = opts.displayName;
  const inCallRef = useRef(opts.inCall);
  inCallRef.current = opts.inCall;
  const spaceSecretRef = useRef(opts.spaceSecret);
  spaceSecretRef.current = opts.spaceSecret;

  const dismissIncomingCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  const markCalling = useCallback((spaceId: string) => {
    callingIdsRef.current.add(spaceId);
    setCallingSpaceId(spaceId);
    setIncomingCall((cur) => (cur?.spaceId === spaceId ? null : cur));
  }, []);

  const clearCalling = useCallback((spaceId: string) => {
    callingIdsRef.current.delete(spaceId);
    setCallingSpaceId((cur) => (cur === spaceId ? null : cur));
  }, []);

  const getCallAnnounce = useCallback((spaceId: string): string | null => {
    if (!callingIdsRef.current.has(spaceId)) return null;
    const name = displayNameRef.current.trim();
    return name || null;
  }, []);

  const onCallWire = useCallback((spaceId: string, author: string, ts: number) => {
    if (callingIdsRef.current.has(spaceId)) return;
    if (
      !shouldOfferIncomingCall({
        author,
        ts,
        selfName: displayNameRef.current,
        alreadyInCall: inCallRef.current,
      })
    ) {
      return;
    }
    const secret = spaceSecretRef.current(spaceId);
    if (!secret) return;
    setIncomingCall({ spaceId, spaceSecret: secret, author: author.trim(), ts });
    playNewMessageSound();
  }, []);

  const onCallEndWire = useCallback((spaceId: string) => {
    setIncomingCall((cur) => (cur?.spaceId === spaceId ? null : cur));
  }, []);

  return {
    incomingCall,
    callingSpaceId,
    dismissIncomingCall,
    markCalling,
    clearCalling,
    getCallAnnounce,
    onCallWire,
    onCallEndWire,
  };
}
