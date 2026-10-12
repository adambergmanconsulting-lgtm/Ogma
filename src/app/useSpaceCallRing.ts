import { useCallback, useEffect, useRef, useState } from 'react';
import {
  callRingSuppressUntil,
  shouldOfferIncomingCall,
  type IncomingCall,
} from '../domain/loom/callRing';
import { startIncomingCallSound, stopIncomingCallSound } from '../domain/loom/callRingSound';
import { threadSecretFromSpace } from '../domain/signaling/threadFromSpace';
import { pulseCallAlert, stopTabAlert } from '../domain/shell/tabAlert';

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
  /** Per-space wall clock: ignore late peer re-announce after Leave / call-end. */
  const suppressUntilRef = useRef(new Map<string, number>());
  const displayNameRef = useRef(opts.displayName);
  displayNameRef.current = opts.displayName;
  const inCallRef = useRef(opts.inCall);
  inCallRef.current = opts.inCall;
  const spaceSecretRef = useRef(opts.spaceSecret);
  spaceSecretRef.current = opts.spaceSecret;

  const clearIncomingAlerts = useCallback(() => {
    stopIncomingCallSound();
    stopTabAlert();
  }, []);

  const dismissIncomingCall = useCallback(() => {
    clearIncomingAlerts();
    setIncomingCall(null);
    setAcceptError(null);
  }, [clearIncomingAlerts]);

  const markCalling = useCallback(
    (spaceId: string) => {
      callingIdsRef.current.add(spaceId);
      setCallingSpaceId(spaceId);
      setIncomingCall((cur) => {
        if (cur?.spaceId === spaceId) clearIncomingAlerts();
        return cur?.spaceId === spaceId ? null : cur;
      });
      setAcceptError(null);
    },
    [clearIncomingAlerts],
  );

  const clearCalling = useCallback((spaceId: string) => {
    callingIdsRef.current.delete(spaceId);
    setCallingSpaceId((cur) => (cur === spaceId ? null : cur));
  }, []);

  /**
   * Leave or remote call-end: stop ringtone for this space, clear Accept, and
   * suppress late re-announces so hang-up cannot leave Safari ringing forever.
   */
  const endRingForSpace = useCallback(
    (spaceId: string) => {
      suppressUntilRef.current.set(spaceId, callRingSuppressUntil());
      const wasCalling = callingIdsRef.current.has(spaceId);
      callingIdsRef.current.delete(spaceId);
      setCallingSpaceId((cur) => (cur === spaceId ? null : cur));
      setIncomingCall((cur) => {
        if (cur?.spaceId !== spaceId) return cur;
        clearIncomingAlerts();
        return null;
      });
      // After Accept, incoming is already null — still silence leftover Web Audio.
      if (wasCalling) clearIncomingAlerts();
      setAcceptError(null);
    },
    [clearIncomingAlerts],
  );

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
        suppressUntil: suppressUntilRef.current.get(spaceId),
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
      if (
        !shouldOfferIncomingCall({
          author,
          ts,
          selfName: displayNameRef.current,
          alreadyInCall: false,
          suppressUntil: suppressUntilRef.current.get(spaceId),
        })
      ) {
        return;
      }
      setIncomingCall((cur) => {
        const next: IncomingCall = {
          spaceId,
          spaceSecret: secret,
          roomId,
          author: author.trim(),
          ts,
        };
        // Re-announce while already offering — keep ringing, do not restart.
        if (cur?.spaceId !== spaceId) {
          startIncomingCallSound();
          pulseCallAlert();
        }
        return next;
      });
      setAcceptError(null);
    })();
  }, []);

  const onCallEndWire = useCallback(
    (spaceId: string) => {
      endRingForSpace(spaceId);
    },
    [endRingForSpace],
  );

  useEffect(() => () => clearIncomingAlerts(), [clearIncomingAlerts]);

  return {
    incomingCall,
    callingSpaceId,
    acceptError,
    setAcceptError,
    dismissIncomingCall,
    markCalling,
    clearCalling,
    endRingForSpace,
    getCallAnnounce,
    onCallWire,
    onCallEndWire,
  };
}
