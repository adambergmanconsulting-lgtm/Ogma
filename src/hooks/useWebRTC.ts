import { useCallback, useEffect, useRef, useState } from 'react';
import {
  openThreadSession,
  type ThreadSession,
} from '../domain/thread/session';
import type { ChatMessage, ConnectionState, RemotePeer } from '../domain/types';

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
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<ThreadSession | null>(null);
  const namesRef = useRef<Map<string, string>>(new Map());
  const streamsRef = useRef<Map<string, MediaStream>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(localStream);
  localStreamRef.current = localStream;

  const publishPeers = useCallback(() => {
    const list: RemotePeer[] = [];
    for (const [id, stream] of streamsRef.current) {
      list.push({
        peerId: id,
        displayName: namesRef.current.get(id) ?? 'Peer',
        stream,
        connectionState: 'connected',
      });
    }
    for (const [id, name] of namesRef.current) {
      if (!streamsRef.current.has(id)) {
        list.push({
          peerId: id,
          displayName: name,
          stream: null,
          connectionState: 'connecting',
        });
      }
    }
    setRemotePeers(list);
  }, []);

  const leave = useCallback(() => {
    const session = sessionRef.current;
    sessionRef.current = null;
    namesRef.current.clear();
    streamsRef.current.clear();
    setRemotePeers([]);
    setConnectionState('left');
    void session?.leave();
  }, []);

  const sendChat = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !sessionRef.current) return;
      const message: ChatMessage = {
        id: `${sessionRef.current.selfId}-${Date.now()}`,
        peerId: sessionRef.current.selfId,
        displayName: displayName.trim() || 'Guest',
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
    },
    [displayName],
  );

  const replaceTrack = useCallback((track: MediaStreamTrack) => {
    const session = sessionRef.current;
    const stream = localStreamRef.current;
    if (!session || !stream) return;
    const old = stream.getTracks().find((t) => t.kind === track.kind);
    if (old && old !== track) {
      session.replaceTrack(old, track);
    }
  }, []);

  useEffect(() => {
    options.onTrackReplaceNeeded?.(replaceTrack);
  }, [options, replaceTrack]);

  useEffect(() => {
    if (!enabled || !roomId || !localStream) {
      return;
    }

    setConnectionState('joining');
    setError(null);
    setMessages([]);
    namesRef.current.clear();
    streamsRef.current.clear();

    let cancelled = false;

    const session = openThreadSession(roomId, {
      onPeerJoin: (id) => {
        if (cancelled) return;
        namesRef.current.set(id, namesRef.current.get(id) ?? 'Peer');
        setConnectionState('connected');
        publishPeers();
        void sessionRef.current?.sendMeta({ displayName: displayName.trim() || 'Guest' });
      },
      onPeerLeave: (id) => {
        if (cancelled) return;
        namesRef.current.delete(id);
        streamsRef.current.delete(id);
        publishPeers();
      },
      onPeerStream: (id, stream) => {
        if (cancelled) return;
        streamsRef.current.set(id, stream);
        setConnectionState('connected');
        publishPeers();
      },
      onChat: (id, wire) => {
        if (cancelled) return;
        setMessages((prev) => [
          ...prev,
          {
            id: wire.id,
            peerId: id,
            displayName: wire.displayName || namesRef.current.get(id) || 'Peer',
            text: wire.text,
            sentAt: wire.sentAt,
          },
        ]);
      },
      onMeta: (id, meta) => {
        if (cancelled) return;
        if (meta.displayName) {
          namesRef.current.set(id, meta.displayName);
          publishPeers();
        }
      },
      onJoinError: (message) => {
        if (cancelled) return;
        setError(message || "Couldn't reach peers — network may block P2P.");
        setConnectionState('error');
      },
    });

    sessionRef.current = session;
    setPeerId(session.selfId);
    session.addStream(localStream);
    void session.sendMeta({ displayName: displayName.trim() || 'Guest' });
    // Alone in room is valid; peers may still be discovering via trackers.
    setConnectionState('connected');

    return () => {
      cancelled = true;
      sessionRef.current = null;
      void session.leave();
    };
  }, [displayName, enabled, localStream, publishPeers, roomId]);

  return {
    peerId,
    remotePeers,
    messages,
    connectionState,
    error,
    sendChat,
    leave,
    replaceTrack,
    peerCount: remotePeers.length + (enabled ? 1 : 0),
  };
}
