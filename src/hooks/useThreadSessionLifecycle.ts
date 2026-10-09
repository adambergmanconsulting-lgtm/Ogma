import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { RoomMode } from '../domain/thread/roomMode';
import {
  countOpenRelays,
  type ControlWire,
  type ThreadSession,
} from '../domain/thread/session';
import type { SpeakingSample } from '../domain/thread/subscribe';
import type { ChatMessage, ConnectionState } from '../domain/types';
import { openBoundSession } from './openBoundSession';

/** Join/leave Trystero room while `enabled` and `roomId` are set. */
export function useThreadSessionLifecycle(options: {
  enabled: boolean;
  roomId: string | null;
  roomMode: RoomMode;
  sessionRef: MutableRefObject<ThreadSession | null>;
  localStreamRef: MutableRefObject<MediaStream | null>;
  localStreamLiveRef: MutableRefObject<MediaStream | null>;
  namesRef: MutableRefObject<Map<string, string>>;
  streamsRef: MutableRefObject<Map<string, MediaStream>>;
  speakingRef: MutableRefObject<Map<string, SpeakingSample>>;
  subscribeFromPeersRef: MutableRefObject<
    Map<string, Extract<ControlWire, { type: 'subscribe' }>>
  >;
  displayNameRef: MutableRefObject<string>;
  publishPeers: () => void;
  resetLocalState: () => void;
  setPeerId: (id: string) => void;
  setConnectionState: Dispatch<SetStateAction<ConnectionState>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setOpenRelays: (n: number) => void;
  onSpeakingTick: () => void;
  onSubscribeTick: () => void;
}): void {
  const {
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
  } = options;

  useEffect(() => {
    if (!enabled || !roomId) return;
    setConnectionState('joining');
    resetLocalState();

    let cancelled = false;
    const { session, openRelays: relays } = openBoundSession(roomId, roomMode, {
      cancelled: () => cancelled,
      names: namesRef.current,
      streams: streamsRef.current,
      speaking: speakingRef.current,
      subscribeFromPeers: subscribeFromPeersRef.current,
      displayName: () => displayNameRef.current.trim() || 'Guest',
      publishPeers,
      setConnectionState,
      setError,
      setMessages,
      clearSessionRefs: () => {
        sessionRef.current = null;
        localStreamRef.current = null;
      },
      onSpeakingTick,
      onSubscribeTick,
      localStream: localStreamLiveRef.current,
    });

    sessionRef.current = session;
    localStreamRef.current = localStreamLiveRef.current;
    setPeerId(session.selfId);
    setConnectionState('connected');
    setOpenRelays(relays);
    const relayPoll = window.setInterval(() => {
      if (!cancelled) setOpenRelays(countOpenRelays());
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(relayPoll);
      sessionRef.current = null;
      localStreamRef.current = null;
      void session.leave();
    };
  }, [
    displayNameRef,
    enabled,
    localStreamLiveRef,
    localStreamRef,
    namesRef,
    onSpeakingTick,
    onSubscribeTick,
    publishPeers,
    resetLocalState,
    roomId,
    roomMode,
    sessionRef,
    setConnectionState,
    setError,
    setMessages,
    setOpenRelays,
    setPeerId,
    speakingRef,
    streamsRef,
    subscribeFromPeersRef,
  ]);
}
