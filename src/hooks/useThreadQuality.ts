import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { LinkQuality, SendQualityTier } from '../domain/media/constraints';
import { createMicLevelMonitor, isSpeakingLevel } from '../domain/media/micLevel';
import {
  maxVideoBitrateBps,
  nextLinkQuality,
  samplePeerLinkQuality,
} from '../domain/media/sendQuality';
import { capacityWarningLabel } from '../domain/thread/capacityCopy';
import type { ControlWire, ThreadSession } from '../domain/thread/session';
import {
  computeWantVideoFrom,
  shouldSendVideoToPeer,
  type SpeakingSample,
} from '../domain/thread/subscribe';
import { shouldSendLocalVideo } from '../domain/media/screenShare';
import { MAX_PEERS, WARN_PEERS } from '../domain/types';

export type SendQualityChange = {
  tier: SendQualityTier;
  linkQuality: LinkQuality;
  weakestPeerId: string | null;
  /** True when outbound camera is paused for sustained poor link (not user mute). */
  videoPausedForLink: boolean;
  peerCount: number;
};

export function useThreadQuality(options: {
  enabled: boolean;
  localStream: MediaStream | null;
  cameraEnabled: boolean;
  screenSharing?: boolean;
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
    screenSharing = false,
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
  const screenSharingRef = useRef(screenSharing);
  screenSharingRef.current = screenSharing;
  const onSendQualityChangeRef = useRef(onSendQualityChange);
  onSendQualityChangeRef.current = onSendQualityChange;

  const linkQualityRef = useRef<LinkQuality>('good');
  const goodStreakRef = useRef(0);
  const weakestPeerIdRef = useRef<string | null>(null);
  const poorHoldRef = useRef(0);
  const pauseOutboundForLinkRef = useRef(false);

  const applyOutboundVideoPolicy = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const self = session.selfId;
    const sendVideo = shouldSendLocalVideo(cameraEnabledRef.current, screenSharingRef.current);
    const pauseForLink = pauseOutboundForLinkRef.current && !screenSharingRef.current;
    for (const id of Object.keys(session.room.getPeers())) {
      const sub = subscribeFromPeersRef.current.get(id);
      const want = sub ? shouldSendVideoToPeer(self, sub) : true;
      session.setOutboundVideoEnabled(id, sendVideo && want && !pauseForLink);
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
  }, [applyOutboundVideoPolicy, cameraEnabled, remotePeerCount, screenSharing]);

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
      setCapacityWarning(capacityWarningLabel(peerCount, MAX_PEERS, WARN_PEERS));
    }, 400);
    return () => {
      window.clearInterval(id);
      monitor.stop();
    };
  }, [enabled, localStream, sessionRef]);

  useEffect(() => {
    if (!enabled) {
      linkQualityRef.current = 'good';
      goodStreakRef.current = 0;
      weakestPeerIdRef.current = null;
      poorHoldRef.current = 0;
      pauseOutboundForLinkRef.current = false;
      return;
    }
    let cancelled = false;
    const tick = async () => {
      const session = sessionRef.current;
      if (!session || cancelled) return;
      const peerCount = session.peerCount();
      const sample = await samplePeerLinkQuality(session.mediaPlane.peersById());
      const stepped = nextLinkQuality(
        linkQualityRef.current,
        sample.worst,
        goodStreakRef.current,
      );
      linkQualityRef.current = stepped.quality;
      goodStreakRef.current = stepped.goodStreak;
      if (sample.worst !== 'good') {
        weakestPeerIdRef.current = sample.weakestPeerId;
      } else if (stepped.quality === 'good') {
        weakestPeerIdRef.current = null;
      }

      if (stepped.quality === 'poor') {
        poorHoldRef.current += 1;
      } else {
        poorHoldRef.current = 0;
        pauseOutboundForLinkRef.current = false;
      }
      if (poorHoldRef.current >= 2 && !screenSharingRef.current) {
        pauseOutboundForLinkRef.current = true;
      }

      const tier: SendQualityTier =
        peerCount <= 2 ? 'high' : localSpeaking ? 'high' : 'low';
      session.applySendBitrate(
        maxVideoBitrateBps(peerCount, tier, stepped.quality),
      );
      applyOutboundVideoPolicy();
      onSendQualityChangeRef.current?.({
        tier,
        linkQuality: stepped.quality,
        weakestPeerId: weakestPeerIdRef.current,
        videoPausedForLink: pauseOutboundForLinkRef.current,
        peerCount,
      });
    };
    void tick();
    const id = window.setInterval(() => void tick(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [applyOutboundVideoPolicy, enabled, localSpeaking, remotePeerCount, sessionRef]);

  return {
    capacityWarning,
    localSpeaking,
    applyOutboundVideoPolicy,
    broadcastSubscribe,
    clearCapacityWarning: () => setCapacityWarning(null),
  };
}
