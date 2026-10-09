import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatDrawer } from '../components/ChatDrawer';
import { ControlBar } from '../components/ControlBar';
import { Lobby } from '../components/Lobby';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { VideoGrid } from '../components/VideoGrid';
import {
  createRoomSecret,
  parseRoomIdFromHash,
  roomHash,
  roomShareUrl,
} from '../domain/signaling/room';
import { extractRoomSecret, shareRoomLink } from '../domain/signaling/share';
import { useUserMedia } from '../hooks/useUserMedia';
import { useWebRTC } from '../hooks/useWebRTC';

type Drawer = 'none' | 'chat' | 'settings';

export default function App() {
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem('ogma.displayName') || '',
  );
  const [roomInput, setRoomInput] = useState('');
  const [activeRoom, setActiveRoom] = useState<string | null>(() =>
    parseRoomIdFromHash(window.location.hash),
  );
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
        window.history.replaceState(null, '', roomHash(roomId));
        setInCall(true);
        setDrawer('none');
      } finally {
        setBusy(false);
      }
    },
    [media],
  );

  const onCreate = useCallback(() => {
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
    window.history.replaceState(null, '', window.location.pathname);
  }, [media, webrtc]);

  const shareUrl = useMemo(
    () => (activeRoom ? roomShareUrl(activeRoom) : ''),
    [activeRoom],
  );

  if (!inCall) {
    return (
      <Lobby
        displayName={displayName}
        roomInput={roomInput}
        mediaError={media.error}
        busy={busy}
        onDisplayName={setDisplayName}
        onRoomInput={setRoomInput}
        onCreate={onCreate}
        onJoin={onJoin}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-col gap-1 border-b border-[color:var(--color-line)] bg-[color:var(--color-panel)]/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-[family-name:var(--font-display)] text-xl tracking-tight">Ogma</div>
            <div className="truncate text-xs text-[color:var(--color-muted)]">
              {webrtc.connectionState === 'connected'
                ? webrtc.remotePeers.length
                  ? 'Connected'
                  : 'Waiting for others…'
                : webrtc.connectionState}
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-[color:var(--color-line)] px-3 py-1.5 text-xs hover:bg-[color:var(--color-panel-2)]"
            onClick={() => {
              if (!shareUrl) return;
              void shareRoomLink(shareUrl).then(() => {
                setLinkHint('Anyone with this link can join.');
              });
            }}
          >
            Share link
          </button>
        </div>
        <p className="text-[11px] text-[color:var(--color-muted)]">
          {linkHint ?? 'Anyone with this link can join. Keep this tab open to stay in the call.'}
        </p>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <VideoGrid
            localStream={media.stream}
            localLabel={displayName.trim() || 'Guest'}
            localMicOff={!media.micEnabled}
            remotePeers={webrtc.remotePeers}
            applyAudioOutput={media.applyAudioOutput}
          />
          {(webrtc.error || media.error) && (
            <p className="px-4 pb-2 text-sm text-[color:var(--color-danger)]">
              {webrtc.error || media.error}
            </p>
          )}
          <ControlBar
            micEnabled={media.micEnabled}
            cameraEnabled={media.cameraEnabled}
            chatOpen={drawer === 'chat'}
            onToggleMic={media.toggleMic}
            onToggleCamera={media.toggleCamera}
            onToggleChat={() => setDrawer((d) => (d === 'chat' ? 'none' : 'chat'))}
            onOpenSettings={() => setDrawer((d) => (d === 'settings' ? 'none' : 'settings'))}
            onLeave={onLeave}
          />
        </div>

        <ChatDrawer
          open={drawer === 'chat'}
          messages={webrtc.messages}
          selfId={webrtc.peerId}
          onClose={() => setDrawer('none')}
          onSend={webrtc.sendChat}
        />
        <SettingsDrawer
          open={drawer === 'settings'}
          videoDevices={media.videoDevices}
          audioDevices={media.audioDevices}
          outputDevices={media.outputDevices}
          videoDeviceId={media.videoDeviceId}
          audioDeviceId={media.audioDeviceId}
          audioOutputId={media.audioOutputId}
          onClose={() => setDrawer('none')}
          onVideoChange={(id) => void media.switchVideoDevice(id)}
          onAudioChange={(id) => void media.switchAudioDevice(id)}
          onOutputChange={media.setAudioOutputId}
        />
      </div>
    </div>
  );
}
