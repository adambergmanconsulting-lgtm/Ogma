import { useCallback, useEffect, useRef, useState } from 'react';
import { bindSessionUi } from '../domain/thread/bindSessionUi';
import { listRemotePeers, syncLocalStream } from '../domain/thread/peerState';
import {
  countOpenRelays,
  openThreadSession,
  type ThreadSession,
} from '../domain/thread/session';
import type { ChatMessage, ConnectionState } from '../domain/types';

export interface UseWebRTCOptions {
  roomId: string | null;
  displayName: string;
  localStream: MediaStream | null;
  enabled: boolean;
  onTrackReplaceNeeded?: (replace: (track: MediaStreamTrack) => void) => void;
}

export function useWebRTC(options: UseWebRTCOptions) {
  const { roomId, displayName, localStream, enabled } = options;
  const [peerId, setPeerId] = useState('');
  const [remotePeers, setRemotePeers] = useState(() => listRemotePeers(new Map(), new Map()));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [openRelays, setOpenRelays] = useState(0);

  const sessionRef = useRef<ThreadSession | null>(null);
  const namesRef = useRef<Map<string, string>>(new Map());
  const streamsRef = useRef<Map<string, MediaStream>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const localStreamLiveRef = useRef(localStream);
  localStreamLiveRef.current = localStream;
  const displayNameRef = useRef(displayName);
  displayNameRef.current = displayName;

  const publishPeers = useCallback(() => {
    setRemotePeers(listRemotePeers(streamsRef.current, namesRef.current));
  }, []);

  const leave = useCallback(() => {
    const session = sessionRef.current;
    sessionRef.current = null;
    localStreamRef.current = null;
    namesRef.current.clear();
    streamsRef.current.clear();
    setRemotePeers([]);
    setMessages([]);
    setError(null);
    setConnectionState('left');
    void session?.leave();
  }, []);

  const sendChat = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !sessionRef.current) return;
    const name = displayNameRef.current.trim() || 'Guest';
    const message: ChatMessage = {
      id: `${sessionRef.current.selfId}-${Date.now()}`,
      peerId: sessionRef.current.selfId,
      displayName: name,
      text: trimmed,
      sentAt: Date.now(),
    };
    setMessages((prev) => [...prev, message]);
    void sessionRef.current.sendChat({
      id: message.id,
      text: message.text,
      displayName: message.displayName,
      sentAt: message.sentAt,
    });
  }, []);

  const replaceTrack = useCallback((track: MediaStreamTrack) => {
    const session = sessionRef.current;
    const stream = localStreamRef.current;
    if (!session || !stream) return;
    const old = stream.getTracks().find((t) => t.kind === track.kind);
    if (old && old !== track) session.replaceTrack(old, track);
  }, []);

  useEffect(() => {
    options.onTrackReplaceNeeded?.(replaceTrack);
  }, [options, replaceTrack]);

  useEffect(() => {
    if (!enabled || !roomId) return;

    setConnectionState('joining');
    setError(null);
    setMessages([]);
    namesRef.current.clear();
    streamsRef.current.clear();
    setRemotePeers([]);

    let cancelled = false;
    const session = openThreadSession(
      roomId,
      bindSessionUi({
        cancelled: () => cancelled,
        names: namesRef.current,
        streams: streamsRef.current,
        displayName: () => displayNameRef.current.trim() || 'Guest',
        publishPeers,
        setConnectionState,
        setError,
        setMessages,
        clearSessionRefs: () => {
          sessionRef.current = null;
          localStreamRef.current = null;
        },
        sendMeta: (meta) => {
          void sessionRef.current?.sendMeta(meta);
        },
      }),
    );

    sessionRef.current = session;
    setPeerId(session.selfId);
    void session.sendMeta({ displayName: displayNameRef.current.trim() || 'Guest' });
    // Attach current camera/mic now — the stream effect may have run before session existed.
    const live = localStreamLiveRef.current;
    if (live) {
      syncLocalStream(session, null, live);
      localStreamRef.current = live;
    } else {
      localStreamRef.current = null;
    }
    setConnectionState('connected');
    setOpenRelays(countOpenRelays());

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
  }, [enabled, publishPeers, roomId]);

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
  };
}
