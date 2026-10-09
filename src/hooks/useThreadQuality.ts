import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { SendQualityTier } from '../domain/media/constraints';
import { createMicLevelMonitor, isSpeakingLevel } from '../domain/media/micLevel';
import {
  maxVideoBitrateBps,
  sampleOutboundCongestion,
} from '../domain/media/sendQuality';
import type { ControlWire, ThreadSession } from '../domain/thread/session';
import {
  computeWantVideoFrom,
  shouldSendVideoToPeer,
  type SpeakingSample,
} from '../domain/thread/subscribe';
import { MAX_PEERS, WARN_PEERS } from '../domain/types';

export type SendQualityChange = {
  tier: SendQualityTier;
  congested: boolean;
  peerCount: number;
};

export function useThreadQuality(options: {
  enabled: boolean;
  localStream: MediaStream | null;
  cameraEnabled: boolean;
  sessionRef: MutableRefObject<ThreadSession | null>;
  speakingRef: MutableRefObject<Map<string, SpeakingSample>>;
  subscribeFromPeersRef: MutableRefObject<
    Map<string, Extract<ControlWire, { type: 'subscribe' }>>
  >;
  pins: string[];
  showAllVideos: boolean;
  remotePeerCount: number;
  onSendQualityChange?: (state: SendQualityChange) => void;
}) {
  const {
    enabled,
    localStream,
    cameraEnabled,
    sessionRef,
    speakingRef,
    subscribeFromPeersRef,
    pins,
    showAllVideos,
    remotePeerCount,
    onSendQualityChange,
  } = options;

  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const pinsRef = useRef(pins);
  pinsRef.current = pins;
  const showAllRef = useRef(showAllVideos);
  showAllRef.current = showAllVideos;
  const cameraEnabledRef = useRef(cameraEnabled);
  cameraEnabledRef.current = cameraEnabled;
  const onSendQualityChangeRef = useRef(onSendQualityChange);
  onSendQualityChangeRef.current = onSendQualityChange;

  const applyOutboundVideoPolicy = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const self = session.selfId;
    const camOn = cameraEnabledRef.current;
    for (const id of Object.keys(session.room.getPeers())) {
      const sub = subscribeFromPeersRef.current.get(id);
      const want = sub ? shouldSendVideoToPeer(self, sub) : true;
      session.setOutboundVideoEnabled(id, camOn && want);
    }
  }, [sessionRef, subscribeFromPeersRef]);

  const broadcastSubscribe = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const remotePeerIds = Object.keys(session.room.getPeers());
    void session.sendSubscribe({
      type: 'subscribe',
      wantVideoFrom: computeWantVideoFrom({
        remotePeerIds,
        pins: pinsRef.current,
        speaking: speakingRef.current,
        showAll: showAllRef.current,
      }),
      pins: pinsRef.current,
      showAll: showAllRef.current,
    });
  }, [sessionRef, speakingRef]);

  useEffect(() => {
    broadcastSubscribe();
  }, [broadcastSubscribe, pins, showAllVideos, remotePeerCount]);

  useEffect(() => {
    applyOutboundVideoPolicy();
  }, [applyOutboundVideoPolicy, cameraEnabled, remotePeerCount]);

  useEffect(() => {
    if (!enabled || !localStream) {
      setLocalSpeaking(false);
      return;
    }
    const monitor = createMicLevelMonitor(localStream);
    if (!monitor) return;
    const id = window.setInterval(() => {
      const level = monitor.getLevel();
      setLocalSpeaking(isSpeakingLevel(level));
      void sessionRef.current?.sendSpeaking(level);
      const peerCount = sessionRef.current?.peerCount() ?? 1;
      setCapacityWarning(
        peerCount >= WARN_PEERS
          ? `Room is getting full (${peerCount} of ${MAX_PEERS}). Quality may drop.`
          : null,
      );
    }, 400);
    return () => {
      window.clearInterval(id);
      monitor.stop();
    };
  }, [enabled, localStream, sessionRef]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const tick = async () => {
      const session = sessionRef.current;
      if (!session || cancelled) return;
      const peerCount = session.peerCount();
      const congested = await sampleOutboundCongestion(session.mediaPlane.peerConnections());
      const tier: SendQualityTier =
        peerCount <= 2 ? 'high' : localSpeaking ? 'high' : 'low';
      session.applySendBitrate(maxVideoBitrateBps(peerCount, tier, congested));
      onSendQualityChangeRef.current?.({ tier, congested, peerCount });
    };
    void tick();
    const id = window.setInterval(() => void tick(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled, localSpeaking, remotePeerCount, sessionRef]);

  return {
    capacityWarning,
    localSpeaking,
    applyOutboundVideoPolicy,
    broadcastSubscribe,
    clearCapacityWarning: () => setCapacityWarning(null),
  };
}
