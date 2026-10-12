import { useCallback, useEffect, useRef, useState } from 'react';
import {
  shouldOfferIncomingCall,
  type IncomingCall,
} from '../domain/loom/callRing';
import { startIncomingCallSound, stopIncomingCallSound } from '../domain/loom/callRingSound';
import { threadSecretFromSpace } from '../domain/signaling/threadFromSpace';

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
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const callingIdsRef = useRef(new Set<string>());
  const displayNameRef = useRef(opts.displayName);
  displayNameRef.current = opts.displayName;
  const inCallRef = useRef(opts.inCall);
  inCallRef.current = opts.inCall;
  const spaceSecretRef = useRef(opts.spaceSecret);
  spaceSecretRef.current = opts.spaceSecret;

  const dismissIncomingCall = useCallback(() => {
    stopIncomingCallSound();
    setIncomingCall(null);
    setAcceptError(null);
  }, []);

  const markCalling = useCallback((spaceId: string) => {
    callingIdsRef.current.add(spaceId);
    setCallingSpaceId(spaceId);
    setIncomingCall((cur) => {
      if (cur?.spaceId === spaceId) stopIncomingCallSound();
      return cur?.spaceId === spaceId ? null : cur;
    });
    setAcceptError(null);
  }, []);

  const clearCalling = useCallback((spaceId: string) => {
    callingIdsRef.current.delete(spaceId);
    setCallingSpaceId((cur) => (cur === spaceId ? null : cur));
  }, []);

  const getCallAnnounce = useCallback((spaceId: string): string | null => {
    if (!callingIdsRef.current.has(spaceId)) return null;
    return displayNameRef.current.trim() || 'Guest';
  }, []);

  const onCallWire = useCallback((spaceId: string, author: string, ts: number) => {
    // Caller already marked this space — ignore echo of our own announce.
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
    void (async () => {
      let roomId = '';
      try {
        roomId = await threadSecretFromSpace(secret);
      } catch {
        // Accept can derive the room under the click if this fails
      }
      if (callingIdsRef.current.has(spaceId) || inCallRef.current) return;
      setIncomingCall((cur) => {
        const next: IncomingCall = {
          spaceId,
          spaceSecret: secret,
          roomId,
          author: author.trim(),
          ts,
        };
        // Re-announce while already offering — keep ringing, do not restart.
        if (cur?.spaceId !== spaceId) startIncomingCallSound();
        return next;
      });
      setAcceptError(null);
    })();
  }, []);

  const onCallEndWire = useCallback((spaceId: string) => {
    setIncomingCall((cur) => {
      if (cur?.spaceId === spaceId) stopIncomingCallSound();
      return cur?.spaceId === spaceId ? null : cur;
    });
    setAcceptError(null);
  }, []);

  useEffect(() => () => stopIncomingCallSound(), []);

  return {
    incomingCall,
    callingSpaceId,
    acceptError,
    setAcceptError,
    dismissIncomingCall,
    markCalling,
    clearCalling,
    getCallAnnounce,
    onCallWire,
    onCallEndWire,
  };
}
