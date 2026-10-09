import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CallShell } from '../components/CallShell';
import { Lobby } from '../components/Lobby';
import {
  clearRoomFromUrl,
  createRoomSecret,
  parseRoomIdFromHash,
  replaceUrlWithRoom,
  roomDisplayCode,
  roomShareUrl,
} from '../domain/signaling/room';
import { extractRoomSecret, shareRoomLink } from '../domain/signaling/share';
import { useUserMedia } from '../hooks/useUserMedia';
import { useWebRTC } from '../hooks/useWebRTC';

type Drawer = 'none' | 'chat' | 'settings';

export default function App() {
  const initialRoom = parseRoomIdFromHash(window.location.hash);
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

  const media = useUserMedia({
    peerCount,
    onTrackReplaced: (track) => replaceTrackRef.current(track),
  });

  const webrtc = useWebRTC({
    roomId: activeRoom,
    displayName: displayName.trim() || 'Guest',
    localStream: media.stream,
    enabled: inCall && Boolean(activeRoom && media.stream),
    onTrackReplaceNeeded: (replace) => {
      replaceTrackRef.current = replace;
    },
  });

  useEffect(() => {
    setPeerCount(Math.max(1, webrtc.peerCount));
  }, [webrtc.peerCount]);

  useEffect(() => {
    localStorage.setItem('ogma.displayName', displayName);
  }, [displayName]);

  useEffect(() => {
    const onHash = () => {
      const id = parseRoomIdFromHash(window.location.hash);
      if (id && !inCall) {
        setActiveRoom(id);
        setRoomInput(id);
        setInviteMode(true);
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [inCall]);

  const enterRoom = useCallback(
    async (roomId: string) => {
      setBusy(true);
      try {
        await media.start();
        setActiveRoom(roomId);
        replaceUrlWithRoom(roomId);
        setInCall(true);
        setDrawer('chat');
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

  const roomCode = activeRoom ? roomDisplayCode(activeRoom) : '';

  const connectionLabel =
    webrtc.connectionState === 'connected'
      ? webrtc.remotePeers.length
        ? 'Connected'
        : webrtc.openRelays > 0
          ? 'Waiting for others…'
          : 'Connecting to trackers…'
      : webrtc.connectionState;

  if (!inCall) {
    return (
      <Lobby
        displayName={displayName}
        roomInput={roomInput}
        mediaError={media.error || webrtc.error}
        busy={busy}
        inviteMode={inviteMode}
        onDisplayName={setDisplayName}
        onRoomInput={setRoomInput}
        onCreate={onCreate}
        onJoin={onJoin}
      />
    );
  }

  return (
    <CallShell
      displayName={displayName.trim() || 'Guest'}
      connectionLabel={connectionLabel}
      roomCode={roomCode}
      linkHint={
        linkHint ??
        `Room ${roomCode} — both people must see the same code. Anyone with this link can join.`
      }
      error={webrtc.error || media.error}
      localStream={media.stream}
      localMicOff={!media.micEnabled}
      remotePeers={webrtc.remotePeers}
      messages={webrtc.messages}
      selfId={webrtc.peerId}
      drawer={drawer}
      micEnabled={media.micEnabled}
      cameraEnabled={media.cameraEnabled}
      videoDevices={media.videoDevices}
      audioDevices={media.audioDevices}
      outputDevices={media.outputDevices}
      videoDeviceId={media.videoDeviceId}
      audioDeviceId={media.audioDeviceId}
      audioOutputId={media.audioOutputId}
      onShareLink={() => {
        if (!shareUrl) return;
        void shareRoomLink(shareUrl).then((result) => {
          if (result.ok) {
            setLinkHint(
              result.method === 'clipboard'
                ? 'Link copied — paste it to the other person.'
                : 'Invite sent. Keep this tab open to stay in the call.',
            );
            return;
          }
          if (result.reason === 'cancelled') {
            setLinkHint('Share cancelled. Tap Share link again to copy.');
            return;
          }
          setLinkHint(`Copy this link manually: ${result.url}`);
        });
      }}
      onToggleMic={media.toggleMic}
      onToggleCamera={media.toggleCamera}
      onToggleChat={() => setDrawer((d) => (d === 'chat' ? 'none' : 'chat'))}
      onOpenSettings={() => setDrawer((d) => (d === 'settings' ? 'none' : 'settings'))}
      onCloseDrawer={() => setDrawer('none')}
      onLeave={onLeave}
      onSendChat={webrtc.sendChat}
      onVideoChange={(id) => void media.switchVideoDevice(id)}
      onAudioChange={(id) => void media.switchAudioDevice(id)}
      onOutputChange={media.setAudioOutputId}
      applyAudioOutput={media.applyAudioOutput}
    />
  );
}
