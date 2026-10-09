import { useEffect, useState, type ReactNode } from 'react';
import { AppNav, type AppNavPlace } from '../components/AppNav';
import { CallShell } from '../components/CallShell';
import { ChatsHome } from '../components/ChatsHome';
import { Lobby } from '../components/Lobby';
import { SecretReveal } from '../components/SecretReveal';
import { SpaceView } from '../components/SpaceView';
import { VaultSettings } from '../components/VaultSettings';
import { VaultSetup } from '../components/VaultSetup';
import { VaultUnlock } from '../components/VaultUnlock';
import { parseRoomIdFromLocation, parseSpaceSecretFromLocation } from '../domain/signaling/room';
import { threadSecretFromSpace } from '../domain/signaling/threadFromSpace';
import type { ChatMessage } from '../domain/types';
import { useCallController } from './useCallController';
import { useLoomController } from './useLoomController';

export default function App() {
  const loom = useLoomController();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [callReturnScreen, setCallReturnScreen] = useState<'chats' | 'space'>('chats');
  const call = useCallController({
    displayName: loom.displayName,
    enabled:
      loom.unlocked &&
      (loom.screen === 'thread' || Boolean(loom.vault && parseRoomIdFromLocation())),
  });

  // Room invite → Join lobby; keep return-to-space when #space= is present.
  useEffect(() => {
    if (!loom.unlocked || call.inCall || !parseRoomIdFromLocation()) return;
    if (loom.screen !== 'chats' && loom.screen !== 'space') return;
    if (parseSpaceSecretFromLocation() || loom.focusedSecret) {
      setCallReturnScreen('space');
    }
    loom.setScreen('thread');
  }, [loom.unlocked, loom.screen, loom.focusedSecret, call.inCall, loom.setScreen]);

  // No cold Call lobby — room-less Thread screen returns to Chats.
  useEffect(() => {
    if (
      loom.unlocked &&
      loom.screen === 'thread' &&
      !call.inCall &&
      !parseRoomIdFromLocation() &&
      !call.inviteMode
    ) {
      loom.setScreen('chats');
    }
  }, [loom.unlocked, loom.screen, call.inCall, call.inviteMode, loom.setScreen]);

  if (loom.screen === 'reveal' && loom.reveal) {
    return (
      <SecretReveal
        title={loom.reveal.kind === 'vault' ? 'Your vault key' : 'Invite link'}
        why={loom.reveal.why}
        secret={loom.reveal.secret}
        busy={loom.busy}
        onContinue={() => void loom.onRevealContinue()}
      />
    );
  }

  if (!loom.vault || loom.screen === 'vault') {
    return (
      <VaultSetup
        busy={loom.busy}
        error={loom.error}
        onContinue={(name) => void loom.onContinueWithoutVault(name)}
        onCreateVault={(name) => void loom.onCreateVault(name)}
        onOpenVault={() => void loom.onOpenVault()}
      />
    );
  }

  if (loom.screen === 'unlock') {
    return (
      <VaultUnlock
        busy={loom.busy}
        error={loom.error}
        onUnlock={(key) => void loom.onUnlockVault(key)}
        onBack={() => loom.setScreen('vault')}
      />
    );
  }

  const place: AppNavPlace = call.inCall
    ? 'call'
    : loom.screen === 'space'
      ? 'space'
      : 'chats';

  const goChats = () => {
    if (call.inCall) call.onLeave();
    loom.onBackToChats();
  };

  const goCall = () => {
    if (call.inCall) return;
    const secret = loom.focusedSecret;
    if (!secret) {
      loom.setScreen('chats');
      return;
    }
    setCallReturnScreen('space');
    void threadSecretFromSpace(secret).then((roomId) => call.startCall(roomId, secret));
  };

  const openSettings = () => {
    setSettingsOpen(true);
  };

  const loomChat =
    Boolean(call.boundSpaceSecret) && Boolean(loom.focusedSecret);
  const callMessages: ChatMessage[] = loomChat
    ? loom.messages.map((m) => ({
        id: m.id,
        peerId: m.self ? '__self__' : m.author,
        displayName: m.author,
        text: m.text,
        sentAt: m.ts,
      }))
    : call.webrtc.messages;

  let body: ReactNode;
  if (call.inCall) {
    body = (
      <CallShell
        displayName={loom.displayName.trim() || 'Guest'}
        connectionLabel={call.statusLabel}
        roomCode={call.roomCode}
        inviteUrl={call.shareUrl}
        linkHint={call.linkHint}
        error={call.webrtc.error || call.media.error}
        localStream={call.media.stream}
        localMicOff={!call.media.micEnabled}
        remotePeers={call.webrtc.remotePeers}
        messages={callMessages}
        selfId={loomChat ? '__self__' : call.webrtc.peerId}
        hasMoreOlder={loomChat ? loom.hasMoreOlder : false}
        loadingOlder={loomChat ? loom.loadingOlder : false}
        onLoadOlder={loomChat ? () => void loom.onLoadOlder() : undefined}
        drawer={call.drawer}
        micEnabled={call.media.micEnabled}
        cameraEnabled={call.media.cameraEnabled}
        backgroundBlur={call.media.backgroundBlur}
        backgroundBlurSupported={call.media.backgroundBlurSupported}
        pinnedPeerIds={call.webrtc.pins}
        showAllVideos={call.webrtc.showAllVideos}
        capacityWarning={call.webrtc.capacityWarning}
        videoDevices={call.media.videoDevices}
        audioDevices={call.media.audioDevices}
        outputDevices={call.media.outputDevices}
        videoDeviceId={call.media.videoDeviceId}
        audioDeviceId={call.media.audioDeviceId}
        audioOutputId={call.media.audioOutputId}
        onCopyInvite={call.onCopyInvite}
        onToggleMic={call.media.toggleMic}
        onToggleCamera={call.media.toggleCamera}
        onToggleBackgroundBlur={() => void call.media.toggleBackgroundBlur()}
        onToggleChat={() => call.setDrawer((d) => (d === 'chat' ? 'none' : 'chat'))}
        onTogglePin={call.webrtc.togglePin}
        onToggleShowAllVideos={() => call.webrtc.setShowAllVideos((v) => !v)}
        onOpenSettings={() => call.setDrawer((d) => (d === 'settings' ? 'none' : 'settings'))}
        onCloseDrawer={() => call.setDrawer('none')}
        onLeave={() => {
          call.onLeave();
          loom.setScreen(callReturnScreen);
        }}
        onSendChat={
          loomChat ? (text) => void loom.onSend(text) : call.webrtc.sendChat
        }
        onVideoChange={(id) => void call.media.switchVideoDevice(id)}
        onAudioChange={(id) => void call.media.switchAudioDevice(id)}
        onOutputChange={call.media.setAudioOutputId}
        applyAudioOutput={call.media.applyAudioOutput}
      />
    );
  } else if (loom.screen === 'space') {
    body = (
      <SpaceView
        title={loom.spaceTitle}
        inviteUrl={loom.inviteUrl}
        messages={loom.messages}
        error={loom.error}
        hasMoreOlder={loom.hasMoreOlder}
        loadingOlder={loom.loadingOlder}
        onLoadOlder={() => void loom.onLoadOlder()}
        onSend={(text) => void loom.onSend(text)}
        onCopyInvite={loom.onCopyInvite}
      />
    );
  } else if (loom.screen === 'thread') {
    body = (
      <Lobby
        displayName={loom.displayName}
        mediaError={call.media.error || call.webrtc.error}
        busy={call.busy}
        canJoin={Boolean(call.roomInput.trim())}
        onJoin={() => {
          setCallReturnScreen(
            parseSpaceSecretFromLocation() || loom.focusedSecret ? 'space' : 'chats',
          );
          call.onJoin();
        }}
      />
    );
  } else {
    body = (
      <ChatsHome
        recent={loom.recent}
        archived={loom.archived}
        displayName={loom.displayName}
        spaceInput={loom.spaceInput}
        busy={loom.busy}
        error={loom.error}
        onSpaceInput={loom.setSpaceInput}
        onCreateSpace={loom.onCreateSpace}
        onJoinSpace={loom.onJoinSpace}
        onOpenSpace={(id) => void loom.onOpenSpace(id)}
        onArchive={(id) => void loom.onArchive(id)}
        onUnarchive={(id) => void loom.onUnarchive(id)}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppNav
        place={place}
        inCall={call.inCall}
        canCall={Boolean(loom.focusedSecret)}
        onChats={goChats}
        onCall={goCall}
        onSettings={openSettings}
      />
      <main className="min-h-0 min-w-0 flex-1 overflow-auto">{body}</main>
      <VaultSettings
        open={settingsOpen}
        displayName={loom.displayName}
        hasVaultKey={loom.hasVaultKey}
        busy={loom.busy}
        error={loom.error}
        onClose={() => setSettingsOpen(false)}
        onRename={(name) => {
          loom.onRenameVault(name);
          setSettingsOpen(false);
        }}
        onEnableVault={() => {
          setSettingsOpen(false);
          void loom.onEnableVault();
        }}
        onExport={() => void loom.onExport()}
        onImportFile={(f) => void loom.onImportFile(f)}
        onLogout={() => {
          setSettingsOpen(false);
          if (call.inCall) call.onLeave();
          loom.onLogout();
        }}
        onSwitchVault={() => {
          setSettingsOpen(false);
          if (call.inCall) call.onLeave();
          loom.onSwitchVault();
        }}
      />
    </div>
  );
}
