import { CallShell } from '../components/CallShell';
import { Lobby } from '../components/Lobby';
import { useCallController } from './useCallController';

export default function App() {
  const c = useCallController();

  if (!c.inCall) {
    return (
      <Lobby
        displayName={c.displayName}
        roomInput={c.roomInput}
        mediaError={c.media.error || c.webrtc.error}
        busy={c.busy}
        inviteMode={c.inviteMode}
        onDisplayName={c.setDisplayName}
        onRoomInput={c.setRoomInput}
        onCreate={c.onCreate}
        onJoin={c.onJoin}
      />
    );
  }

  return (
    <CallShell
      displayName={c.displayName.trim() || 'Guest'}
      connectionLabel={c.statusLabel}
      roomCode={c.roomCode}
      inviteUrl={c.shareUrl}
      linkHint={c.linkHint}
      error={c.webrtc.error || c.media.error}
      localStream={c.media.stream}
      localMicOff={!c.media.micEnabled}
      remotePeers={c.webrtc.remotePeers}
      messages={c.webrtc.messages}
      selfId={c.webrtc.peerId}
      drawer={c.drawer}
      micEnabled={c.media.micEnabled}
      cameraEnabled={c.media.cameraEnabled}
      pinnedPeerIds={c.webrtc.pins}
      showAllVideos={c.webrtc.showAllVideos}
      capacityWarning={c.webrtc.capacityWarning}
      videoDevices={c.media.videoDevices}
      audioDevices={c.media.audioDevices}
      outputDevices={c.media.outputDevices}
      videoDeviceId={c.media.videoDeviceId}
      audioDeviceId={c.media.audioDeviceId}
      audioOutputId={c.media.audioOutputId}
      onCopyInvite={c.onCopyInvite}
      onToggleMic={c.media.toggleMic}
      onToggleCamera={c.media.toggleCamera}
      onToggleChat={() => c.setDrawer((d) => (d === 'chat' ? 'none' : 'chat'))}
      onTogglePin={c.webrtc.togglePin}
      onToggleShowAllVideos={() => c.webrtc.setShowAllVideos((v) => !v)}
      onOpenSettings={() => c.setDrawer((d) => (d === 'settings' ? 'none' : 'settings'))}
      onCloseDrawer={() => c.setDrawer('none')}
      onLeave={c.onLeave}
      onSendChat={c.webrtc.sendChat}
      onVideoChange={(id) => void c.media.switchVideoDevice(id)}
      onAudioChange={(id) => void c.media.switchAudioDevice(id)}
      onOutputChange={c.media.setAudioOutputId}
      applyAudioOutput={c.media.applyAudioOutput}
    />
  );
}
