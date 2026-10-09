import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearRoomFromUrl,
  createRoomSecret,
  parseRoomIdFromLocation,
  replaceUrlWithRoom,
  roomDisplayCode,
  roomShareUrl,
} from '../domain/signaling/room';
import { extractRoomSecret, shareRoomLink } from '../domain/signaling/share';
import { connectionLabel } from '../domain/thread/connectionLabel';
import { useUserMedia } from '../hooks/useUserMedia';
import { useWebRTC } from '../hooks/useWebRTC';

type Drawer = 'none' | 'chat' | 'settings';

/** Lobby + in-call state wiring for App shell. */
export function useCallController() {
  const initialRoom = parseRoomIdFromLocation(window.location);
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem('ogma.displayName') || '',
  );
  const [roomInput, setRoomInput] = useState(() => initialRoom ?? '');
  const [activeRoom, setActiveRoom] = useState<string | null>(() => initialRoom);
  const [inviteMode, setInviteMode] = useState(() => Boolean(initialRoom));
  const [inCall, setInCall] = useState(false);
  const [busy, setBusy] = useState(false);
  const [drawer, setDrawer] = useState<Drawer>('none');
  const [linkHint, setLinkHint] = useState<string | null>(null);
  const replaceTrackRef = useRef<(track: MediaStreamTrack) => void>(() => undefined);
  const [peerCount, setPeerCount] = useState(1);
  const [qualityTier, setQualityTier] = useState<'high' | 'low'>('high');
  const [congested, setCongested] = useState(false);

  const media = useUserMedia({
    peerCount,
    qualityTier,
    congested,
    onTrackReplaced: (track) => replaceTrackRef.current(track),
  });

  const webrtc = useWebRTC({
    roomId: activeRoom,
    displayName: displayName.trim() || 'Guest',
    localStream: media.stream,
    enabled: inCall && Boolean(activeRoom && media.stream),
    cameraEnabled: media.cameraEnabled,
    onTrackReplaceNeeded: (replace) => {
      replaceTrackRef.current = replace;
    },
    onSendQualityChange: ({ tier, congested: c, peerCount: n }) => {
      setQualityTier(tier);
      setCongested(c);
      setPeerCount(Math.max(1, n));
    },
  });

  useEffect(() => {
    setPeerCount(Math.max(1, webrtc.peerCount));
  }, [webrtc.peerCount]);

  useEffect(() => {
    localStorage.setItem('ogma.displayName', displayName);
  }, [displayName]);

  useEffect(() => {
    const syncFromLocation = () => {
      const id = parseRoomIdFromLocation(window.location);
      if (id && !inCall) {
        setActiveRoom(id);
        setRoomInput(id);
        setInviteMode(true);
      }
    };
    window.addEventListener('hashchange', syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('hashchange', syncFromLocation);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, [inCall]);

  const enterRoom = useCallback(
    async (roomId: string) => {
      setBusy(true);
      try {
        await media.start();
        setActiveRoom(roomId);
        replaceUrlWithRoom(roomId);
        setInCall(true);
        setDrawer('none');
        setLinkHint(null);
      } finally {
        setBusy(false);
      }
    },
    [media],
  );

  const onCreate = useCallback(() => {
    setInviteMode(false);
    void enterRoom(createRoomSecret());
  }, [enterRoom]);

  const onJoin = useCallback(() => {
    const id = extractRoomSecret(roomInput);
    if (!id) return;
    void enterRoom(id);
  }, [enterRoom, roomInput]);

  const onLeave = useCallback(() => {
    webrtc.leave();
    media.stop();
    setInCall(false);
    setActiveRoom(null);
    setDrawer('none');
    setLinkHint(null);
    clearRoomFromUrl();
  }, [media, webrtc]);

  const shareUrl = useMemo(
    () => (activeRoom ? roomShareUrl(activeRoom) : ''),
    [activeRoom],
  );

  return {
    displayName,
    setDisplayName,
    roomInput,
    setRoomInput,
    inviteMode,
    inCall,
    busy,
    drawer,
    setDrawer,
    linkHint,
    setLinkHint,
    media,
    webrtc,
    onCreate,
    onJoin,
    onLeave,
    shareUrl,
    roomCode: activeRoom ? roomDisplayCode(activeRoom) : '',
    statusLabel: connectionLabel(
      webrtc.connectionState,
      webrtc.remotePeers.length,
      webrtc.openRelays,
    ),
    onCopyInvite: async () => {
      if (!shareUrl) return { ok: false as const, reason: 'failed' as const, url: '' };
      const result = await shareRoomLink(shareUrl);
      if (result.ok) setLinkHint(null);
      else if (result.reason === 'cancelled') {
        setLinkHint('Share cancelled');
      }
      return result;
    },
  };
}
