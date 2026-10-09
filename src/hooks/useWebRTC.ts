import { useCallback, useEffect, useRef, useState } from 'react';
import { listRemotePeers, syncLocalStream } from '../domain/thread/peerState';
import { DEFAULT_ROOM_MODE, type RoomMode } from '../domain/thread/roomMode';
import type { ControlWire, ThreadSession } from '../domain/thread/session';
import type { SpeakingSample } from '../domain/thread/subscribe';
import type { ChatMessage, ConnectionState } from '../domain/types';
import { replaceSessionTrack, sendThreadChat } from './threadSessionActions';
import { useThreadQuality, type SendQualityChange } from './useThreadQuality';
import { useThreadSessionLifecycle } from './useThreadSessionLifecycle';

export interface UseWebRTCOptions {
  roomId: string | null;
  displayName: string;
  localStream: MediaStream | null;
  enabled: boolean;
  cameraEnabled?: boolean;
  roomMode?: RoomMode;
  onTrackReplaceNeeded?: (replace: (track: MediaStreamTrack) => void) => void;
  onSendQualityChange?: (state: SendQualityChange) => void;
}

export function useWebRTC(options: UseWebRTCOptions) {
  const {
    roomId,
    displayName,
    localStream,
    enabled,
    cameraEnabled = true,
    roomMode = DEFAULT_ROOM_MODE,
  } = options;
  const [peerId, setPeerId] = useState('');
  const [remotePeers, setRemotePeers] = useState(() => listRemotePeers(new Map(), new Map()));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [openRelays, setOpenRelays] = useState(0);
  const [pins, setPins] = useState<string[]>([]);
  const [showAllVideos, setShowAllVideos] = useState(false);

  const sessionRef = useRef<ThreadSession | null>(null);
  const namesRef = useRef(new Map<string, string>());
  const streamsRef = useRef(new Map<string, MediaStream>());
  const speakingRef = useRef(new Map<string, SpeakingSample>());
  const subscribeFromPeersRef = useRef(
    new Map<string, Extract<ControlWire, { type: 'subscribe' }>>(),
  );
  const localStreamRef = useRef<MediaStream | null>(null);
  const localStreamLiveRef = useRef(localStream);
  localStreamLiveRef.current = localStream;
  const displayNameRef = useRef(displayName);
  displayNameRef.current = displayName;

  const publishPeers = useCallback(() => {
    setRemotePeers(listRemotePeers(streamsRef.current, namesRef.current));
  }, []);

  const quality = useThreadQuality({
    enabled,
    localStream,
    cameraEnabled,
    sessionRef,
    speakingRef,
    subscribeFromPeersRef,
    pins,
    showAllVideos,
    remotePeerCount: remotePeers.length,
    onSendQualityChange: options.onSendQualityChange,
  });
  const qualityRef = useRef(quality);
  qualityRef.current = quality;

  const resetLocalState = useCallback(() => {
    namesRef.current.clear();
    streamsRef.current.clear();
    speakingRef.current.clear();
    subscribeFromPeersRef.current.clear();
    setRemotePeers([]);
    setMessages([]);
    setError(null);
    qualityRef.current.clearCapacityWarning();
    setPins([]);
    setShowAllVideos(false);
  }, []);

  const onSpeakingTick = useCallback(() => qualityRef.current.broadcastSubscribe(), []);
  const onSubscribeTick = useCallback(() => qualityRef.current.applyOutboundVideoPolicy(), []);

  useThreadSessionLifecycle({
    enabled,
    roomId,
    roomMode,
    sessionRef,
    localStreamRef,
    localStreamLiveRef,
    namesRef,
    streamsRef,
    speakingRef,
    subscribeFromPeersRef,
    displayNameRef,
    publishPeers,
    resetLocalState,
    setPeerId,
    setConnectionState,
    setError,
    setMessages,
    setOpenRelays,
    onSpeakingTick,
    onSubscribeTick,
  });

  const leave = useCallback(() => {
    const session = sessionRef.current;
    sessionRef.current = null;
    localStreamRef.current = null;
    resetLocalState();
    setConnectionState('left');
    void session?.leave();
  }, [resetLocalState]);

  const sendChat = useCallback((text: string) => {
    if (sessionRef.current) {
      sendThreadChat(sessionRef.current, displayNameRef.current, text, (m) =>
        setMessages((prev) => [...prev, m]),
      );
    }
  }, []);

  const replaceTrack = useCallback((track: MediaStreamTrack) => {
    if (sessionRef.current && localStreamRef.current) {
      replaceSessionTrack(sessionRef.current, localStreamRef.current, track);
    }
  }, []);

  useEffect(() => {
    options.onTrackReplaceNeeded?.(replaceTrack);
  }, [options, replaceTrack]);

  useEffect(() => {
    const session = sessionRef.current;
    if (!enabled || !session || !localStream) return;
    const prev = localStreamRef.current;
    if (prev === localStream) return;
    syncLocalStream(session, prev, localStream);
    localStreamRef.current = localStream;
  }, [enabled, localStream]);

  useEffect(() => {
    if (!enabled || !sessionRef.current) return;
    void sessionRef.current.sendMeta({ displayName: displayName.trim() || 'Guest' });
  }, [displayName, enabled]);

  return {
    peerId,
    remotePeers,
    messages,
    connectionState,
    error,
    openRelays,
    sendChat,
    leave,
    replaceTrack,
    peerCount: remotePeers.length + (enabled ? 1 : 0),
    pins,
    togglePin: (id: string) =>
      setPins((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
    showAllVideos,
    setShowAllVideos,
    capacityWarning: quality.capacityWarning,
    localSpeaking: quality.localSpeaking,
  };
}
