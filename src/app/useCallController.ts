import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearRoomFromUrl,
  createRoomSecret,
  parseRoomIdFromLocation,
  parseSpaceSecretFromLocation,
  replaceUrlWithRoom,
  roomDisplayCode,
  roomShareUrl,
} from '../domain/signaling/room';
import { extractRoomSecret, shareRoomLink } from '../domain/signaling/share';
import { connectionLabel } from '../domain/thread/connectionLabel';
import { useUserMedia } from '../hooks/useUserMedia';
import { useWebRTC } from '../hooks/useWebRTC';

type Drawer = 'none' | 'chat' | 'settings';

type CallControllerOpts = {
  /** Vault display name (required before call). */
  displayName: string;
  /** When false, ignore URL auto-join until user opens Call from Chats. */
  enabled?: boolean;
};

/** Lobby + in-call state wiring for App shell. */
export function useCallController(opts: CallControllerOpts) {
  const displayName = opts.displayName;
  const enabled = opts.enabled !== false;
  const initialRoom = enabled ? parseRoomIdFromLocation(window.location) : null;
  const [roomInput, setRoomInput] = useState(() => initialRoom ?? '');
  const [activeRoom, setActiveRoom] = useState<string | null>(() => initialRoom);
  const [inviteMode, setInviteMode] = useState(() => Boolean(initialRoom));
  const [inCall, setInCall] = useState(false);
  const [busy, setBusy] = useState(false);
  const [drawer, setDrawer] = useState<Drawer>('none');
  const [linkHint, setLinkHint] = useState<string | null>(null);
  /** Loom space secret for this call's chat (Call-from-chat / invite with #space=). */
  const [boundSpaceSecret, setBoundSpaceSecret] = useState<string | null>(() =>
    initialRoom ? parseSpaceSecretFromLocation() : null,
  );
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
    if (!enabled) return;
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
  }, [enabled, inCall]);

  const enterRoom = useCallback(
    async (roomId: string, spaceSecret?: string | null) => {
      setBusy(true);
      try {
        await media.start();
        setActiveRoom(roomId);
        const space = spaceSecret?.trim() || null;
        setBoundSpaceSecret(space);
        replaceUrlWithRoom(roomId, space ? { spaceSecret: space } : undefined);
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
    const space = parseSpaceSecretFromLocation();
    void enterRoom(id, space);
  }, [enterRoom, roomInput]);

  const onLeave = useCallback(() => {
    webrtc.leave();
    media.stop();
    setInCall(false);
    setActiveRoom(null);
    setBoundSpaceSecret(null);
    setInviteMode(false);
    setDrawer('none');
    setLinkHint(null);
    clearRoomFromUrl();
  }, [media, webrtc]);

  /** Re-apply ?room= (+ #space=) after soft-nav cleared the address bar. */
  const restoreShareUrl = useCallback(() => {
    if (!activeRoom) return;
    replaceUrlWithRoom(
      activeRoom,
      boundSpaceSecret ? { spaceSecret: boundSpaceSecret } : undefined,
    );
  }, [activeRoom, boundSpaceSecret]);

  const shareUrl = useMemo(
    () =>
      activeRoom
        ? roomShareUrl(
            activeRoom,
            boundSpaceSecret ? { spaceSecret: boundSpaceSecret } : undefined,
          )
        : '',
    [activeRoom, boundSpaceSecret],
  );

  return {
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
    /** Join/create a Thread; pass spaceSecret so Call chat is that Loom log. */
    startCall: (roomId: string, spaceSecret?: string) => void enterRoom(roomId, spaceSecret),
    /** Space secret bound to this call (Loom chat), if any. */
    boundSpaceSecret,
    onLeave,
    restoreShareUrl,
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
