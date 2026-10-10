import { useEffect, useState, type ReactNode } from 'react';
import { AppHome } from '../components/AppHome';
import { AppNav, type AppNavPlace } from '../components/AppNav';
import { CallShell } from '../components/CallShell';
import { InCallBar } from '../components/InCallBar';
import { Lobby } from '../components/Lobby';
import { SecretReveal } from '../components/SecretReveal';
import { SpaceView } from '../components/SpaceView';
import { VaultSettings } from '../components/VaultSettings';
import { VaultSetup } from '../components/VaultSetup';
import { VaultUnlock } from '../components/VaultUnlock';
import { parseRoomIdFromLocation } from '../domain/signaling/room';
import { threadSecretFromSpace } from '../domain/signaling/threadFromSpace';
import {
  pickHomeAnchor,
  readDismissed,
  VAULT_NUDGE_DISMISS_KEY,
  writeDismissed,
} from '../domain/shell/pwaInstall';
import { resolveCallSurface } from '../domain/thread/callSurface';
import type { ChatMessage } from '../domain/types';
import { useCallController } from './useCallController';
import { useLoomController } from './useLoomController';
import { usePwaInstall } from './usePwaInstall';
import { usePwaUpdate } from './usePwaUpdate';

export default function App() {
  const loom = useLoomController();
  const pwa = usePwaInstall();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [vaultNudgeDismissed, setVaultNudgeDismissed] = useState(() =>
    readDismissed(VAULT_NUDGE_DISMISS_KEY),
  );
  /** Room-only CallShell visible (false after soft-nav home). */
  const [roomShellOpen, setRoomShellOpen] = useState(true);
  const call = useCallController({
    displayName: loom.displayName,
    enabled:
      loom.unlocked &&
      (loom.screen === 'thread' || Boolean(loom.vault && parseRoomIdFromLocation())),
  });
  usePwaUpdate({ inCall: call.inCall });

  const hasLocalChats = loom.chats.length > 0;
  const homeAnchor = pickHomeAnchor({
    standalone: pwa.standalone,
    installDismissed: pwa.installDismissed,
    vaultNudgeDismissed,
    hasLocalChats,
    hasVaultKey: loom.hasVaultKey,
  });

  const callSurface = resolveCallSurface({
    inCall: call.inCall,
    boundSpaceSecret: call.boundSpaceSecret,
    focusedSecret: loom.focusedSecret,
    screen: loom.screen,
    roomShellOpen,
  });

  // Room invite → Join lobby.
  useEffect(() => {
    if (!loom.unlocked || call.inCall || !parseRoomIdFromLocation()) return;
    if (loom.screen !== 'home' && loom.screen !== 'space') return;
    loom.setScreen('thread');
  }, [loom.unlocked, loom.screen, call.inCall, loom.setScreen]);

  // No cold Call lobby — room-less Thread screen returns home.
  useEffect(() => {
    if (
      loom.unlocked &&
      loom.screen === 'thread' &&
      !call.inCall &&
      !parseRoomIdFromLocation() &&
      !call.inviteMode
    ) {
      loom.setScreen('home');
    }
  }, [loom.unlocked, loom.screen, call.inCall, call.inviteMode, loom.setScreen]);

  // Entering a call shows room shell when there is no bound space.
  useEffect(() => {
    if (call.inCall && !call.boundSpaceSecret) setRoomShellOpen(true);
  }, [call.inCall, call.boundSpaceSecret]);

  // Soft-nav / open-space clears ?room= — keep the live invite in the address bar.
  useEffect(() => {
    if (!call.inCall) return;
    call.restoreShareUrl();
  }, [call.inCall, call.restoreShareUrl, loom.focusedSecret, loom.screen]);

  if (loom.screen === 'reveal' && loom.reveal) {
    return (
      <SecretReveal
        title="Your vault key"
        why={loom.reveal.why}
        secret={loom.reveal.secret}
        busy={loom.busy}
        onContinue={() => loom.onRevealContinue()}
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
        onProbeVault={() => loom.onProbeVault()}
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

  const place: AppNavPlace =
    callSurface === 'space-call' || callSurface === 'room-shell'
      ? 'call'
      : loom.screen === 'space'
        ? 'space'
        : 'home';

  const goHome = () => {
    loom.onBackToHome();
    if (call.inCall) {
      setRoomShellOpen(false);
      call.restoreShareUrl();
    }
  };

  const startCallWithSecret = async (secret: string) => {
    const roomId = await threadSecretFromSpace(secret);
    call.startCall(roomId, secret);
  };

  const returnToCall = () => {
    if (!call.inCall) return;
    if (call.boundSpaceSecret) {
      void loom.onOpenSpaceSecret(call.boundSpaceSecret);
      return;
    }
    setRoomShellOpen(true);
  };

  const goStartChat = () => {
    void loom.onCreateSpace();
  };

  const goStartCall = () => {
    if (call.inCall) {
      returnToCall();
      return;
    }
    if (loom.busy) return;
    void (async () => {
      const secret = await loom.createAndOpenSpace();
      if (!secret) return;
      await startCallWithSecret(secret);
    })();
  };

  /** Upgrade open space to Call (nav). */
  const goCall = () => {
    if (call.inCall || loom.busy || !loom.focusedSecret) return;
    void startCallWithSecret(loom.focusedSecret);
  };

  const goOpenChat = (spaceId: string) => {
    void loom.onOpenSpace(spaceId);
  };

  const goOpenCall = (spaceId: string) => {
    if (call.inCall) {
      returnToCall();
      return;
    }
    if (loom.busy) return;
    void (async () => {
      const secret = await loom.onOpenSpace(spaceId);
      if (!secret) return;
      await startCallWithSecret(secret);
    })();
  };

  const openSettings = () => {
    setSettingsOpen(true);
  };

  const loomChat =
    Boolean(call.boundSpaceSecret) && loom.focusedSecret === call.boundSpaceSecret;
  const callMessages: ChatMessage[] = loomChat
    ? loom.messages.map((m) => ({
        id: m.id,
        peerId: m.self ? '__self__' : m.author,
        displayName: m.author,
        text: m.text,
        sentAt: m.ts,
      }))
    : call.webrtc.messages;

  const leaveCall = () => {
    call.onLeave();
    setRoomShellOpen(false);
  };

  const spaceCallBand =
    callSurface === 'space-call'
      ? {
          connectionLabel: call.statusLabel,
          roomCode: call.roomCode,
          linkHint: call.linkHint,
          error: call.webrtc.error || call.media.error,
          localStream: call.media.stream,
          localMicOff: !call.media.micEnabled,
          remotePeers: call.webrtc.remotePeers,
          displayName: loom.displayName.trim() || 'Guest',
          micEnabled: call.media.micEnabled,
          cameraEnabled: call.media.cameraEnabled,
          backgroundBlur: call.media.backgroundBlur,
          backgroundBlurSupported: call.media.backgroundBlurSupported,
          privacyBackdropSelectable: call.media.privacyBackdropSelectable,
          privacyBackdropId: call.media.privacyBackdropId,
          maskEdgeCut: call.media.maskEdgeCut,
          pinnedPeerIds: call.webrtc.pins,
          showAllVideos: call.webrtc.showAllVideos,
          capacityWarning: call.webrtc.capacityWarning,
          devicesOpen: call.drawer === 'settings',
          videoDevices: call.media.videoDevices,
          audioDevices: call.media.audioDevices,
          outputDevices: call.media.outputDevices,
          videoDeviceId: call.media.videoDeviceId,
          audioDeviceId: call.media.audioDeviceId,
          audioOutputId: call.media.audioOutputId,
          onToggleMic: call.media.toggleMic,
          onToggleCamera: call.media.toggleCamera,
          onToggleBackgroundBlur: () => void call.media.toggleBackgroundBlur(),
          onPrivacyBackdropChange: call.media.setPrivacyBackdrop,
          onMaskEdgeCutChange: call.media.setMaskEdgeCut,
          onTogglePin: call.webrtc.togglePin,
          onToggleShowAllVideos: () => call.webrtc.setShowAllVideos((v) => !v),
          onOpenDevices: () => call.setDrawer('settings'),
          onCloseDevices: () => call.setDrawer('none'),
          onLeave: leaveCall,
          onVideoChange: (id: string) => void call.media.switchVideoDevice(id),
          onAudioChange: (id: string) => void call.media.switchAudioDevice(id),
          onOutputChange: call.media.setAudioOutputId,
          applyAudioOutput: call.media.applyAudioOutput,
        }
      : null;

  let body: ReactNode;
  if (callSurface === 'space-call') {
    body = (
      <SpaceView
        title={loom.spaceTitle}
        selfLabel={loom.displayName.trim() || 'You'}
        inviteUrl={call.shareUrl || loom.inviteUrl}
        messages={loom.messages}
        error={loom.error}
        hasMoreOlder={loom.hasMoreOlder}
        loadingOlder={loom.loadingOlder}
        onLoadOlder={() => void loom.onLoadOlder()}
        onSend={(text) => void loom.onSend(text)}
        onCopyInvite={call.onCopyInvite}
        call={spaceCallBand}
      />
    );
  } else if (callSurface === 'room-shell') {
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
        selfId={call.webrtc.peerId}
        drawer={call.drawer}
        micEnabled={call.media.micEnabled}
        cameraEnabled={call.media.cameraEnabled}
        backgroundBlur={call.media.backgroundBlur}
        backgroundBlurSupported={call.media.backgroundBlurSupported}
        privacyBackdropSelectable={call.media.privacyBackdropSelectable}
        privacyBackdropId={call.media.privacyBackdropId}
        maskEdgeCut={call.media.maskEdgeCut}
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
        onPrivacyBackdropChange={call.media.setPrivacyBackdrop}
        onMaskEdgeCutChange={call.media.setMaskEdgeCut}
        onToggleChat={() => call.setDrawer((d) => (d === 'chat' ? 'none' : 'chat'))}
        onTogglePin={call.webrtc.togglePin}
        onToggleShowAllVideos={() => call.webrtc.setShowAllVideos((v) => !v)}
        onOpenSettings={() => call.setDrawer((d) => (d === 'settings' ? 'none' : 'settings'))}
        onCloseDrawer={() => call.setDrawer('none')}
        onLeave={leaveCall}
        onSendChat={call.webrtc.sendChat}
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
        selfLabel={loom.displayName.trim() || 'You'}
        inviteUrl={loom.inviteUrl}
        messages={loom.messages}
        error={loom.error}
        hasMoreOlder={loom.hasMoreOlder}
        loadingOlder={loom.loadingOlder}
        onLoadOlder={() => void loom.onLoadOlder()}
        onSend={(text) => void loom.onSend(text)}
        onCopyInvite={loom.onCopyInvite}
        onStartCall={call.inCall ? undefined : goCall}
        callBusy={loom.busy || call.busy}
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
          setRoomShellOpen(true);
          call.onJoin();
        }}
      />
    );
  } else {
    body = (
      <AppHome
        chats={loom.chats}
        displayName={loom.displayName}
        spaceInput={loom.spaceInput}
        busy={loom.busy}
        error={loom.error}
        homeAnchor={homeAnchor}
        installMode={pwa.mode}
        installHowOpen={pwa.howOpen}
        onInstall={() => void pwa.runInstall()}
        onDismissInstall={pwa.dismissInstall}
        onVaultNudge={() => {
          writeDismissed(VAULT_NUDGE_DISMISS_KEY);
          setVaultNudgeDismissed(true);
          setSettingsOpen(false);
          void loom.onEnableVault();
        }}
        onDismissVaultNudge={() => {
          writeDismissed(VAULT_NUDGE_DISMISS_KEY);
          setVaultNudgeDismissed(true);
        }}
        onSpaceInput={loom.setSpaceInput}
        onStartChat={goStartChat}
        onStartCall={goStartCall}
        onJoinSpace={loom.onJoinSpace}
        onOpenChat={goOpenChat}
        onOpenCall={goOpenCall}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppNav place={place} onHome={goHome} onSettings={openSettings} />
      <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{body}</main>
      {callSurface === 'background' ? (
        <InCallBar
          statusLabel={call.statusLabel}
          onReturn={returnToCall}
          onLeave={leaveCall}
        />
      ) : null}
      <VaultSettings
        open={settingsOpen}
        displayName={loom.displayName}
        hasVaultKey={loom.hasVaultKey}
        installMode={pwa.mode}
        installHowOpen={pwa.howOpen}
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
        onInstall={() => void pwa.runInstall()}
        onExport={() => void loom.onExport()}
        onImportFile={(f) => void loom.onImportFile(f)}
        onLogout={() => {
          setSettingsOpen(false);
          if (call.inCall) call.onLeave();
          setRoomShellOpen(false);
          loom.onLogout();
        }}
        onSwitchVault={() => {
          setSettingsOpen(false);
          if (call.inCall) call.onLeave();
          setRoomShellOpen(false);
          loom.onSwitchVault();
        }}
      />
    </div>
  );
}
