import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AppNav, type AppNavPlace } from '../components/AppNav';
import { AppWorkShell } from '../components/AppWorkShell';
import type { ChatPane } from '../components/ChatColumn';
import { PreviousSpacesList } from '../components/PreviousSpacesList';
import type { PersonReach } from '../components/PersonReach';
import { CallShell } from '../components/CallShell';
import { InCallBar } from '../components/InCallBar';
import { Lobby } from '../components/Lobby';
import { SecretReveal } from '../components/SecretReveal';
import { SpaceView } from '../components/SpaceView';
import { VaultSetup } from '../components/VaultSetup';
import { VaultUnlock } from '../components/VaultUnlock';
import { WorkspaceIdle } from '../components/WorkspaceIdle';
import { isFreshSoloChat } from '../domain/loom/spaceIndex';
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
import { AppSettingsDrawer } from './AppSettingsDrawer';
import { buildSpaceCallBand } from './buildSpaceCallBand';
import { useCallController } from './useCallController';
import { useLoomController } from './useLoomController';
import { usePersonPresence } from './usePersonPresence';
import { usePwaInstall } from './usePwaInstall';
import { usePwaUpdate } from './usePwaUpdate';

export default function App() {
  const loom = useLoomController();
  const presence = usePersonPresence({
    wrapKey: loom.wrapKey,
    displayName: loom.displayName,
    setOwnCard: loom.setOwnCard,
    onOpenSecret: (secret) => loom.onOpenSpaceSecret(secret),
  });
  const reach: PersonReach = {
    selfPersonId: presence.selfPersonId,
    appearActive: presence.appearActive,
    tabVisible: presence.tabVisible,
    people: presence.people,
    cardForName: presence.cardForName,
    onToggleAppearActive: presence.toggleAppearActive,
    onInvite: (id) => void presence.invite(id),
    onInviteHere: loom.focusedSecret
      ? (id) => {
          const secret = loom.focusedSecret;
          if (secret) void presence.invite(id, secret);
        }
      : undefined,
  };
  const pwa = usePwaInstall();
  const preferSpaces = useRef(false);
  const [chatPane, setChatPane] = useState<ChatPane>('spaces');
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

  // No cold Call lobby — room-less Thread screen returns idle work shell.
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

  // Resume opens the chat unless the user asked for the All tab.
  useEffect(() => {
    if (preferSpaces.current) return;
    if (loom.focusedSecret) setChatPane('chat');
  }, [loom.focusedSecret]);

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

  const showChat = () => {
    preferSpaces.current = false;
    setChatPane('chat');
  };

  const showSpaces = () => {
    preferSpaces.current = true;
    setChatPane('spaces');
  };

  const goHome = () => {
    showSpaces();
    if (call.inCall) {
      loom.onBackToHome();
      setRoomShellOpen(false);
      call.restoreShareUrl();
      return;
    }
    if (!loom.focusedSecret) {
      void loom.resumeLastSpace();
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

  const freshSoloChat =
    Boolean(loom.focusedSecret) &&
    isFreshSoloChat(
      loom.people,
      loom.displayName,
      loom.messages.some((m) => m.kind === 'text'),
    );

  const goNewChat = () => {
    showChat();
    if (freshSoloChat) return;
    void loom.onCreateSpace();
  };

  /** Upgrade open space to Call (video pane). */
  const goCall = () => {
    if (call.inCall || loom.busy || !loom.focusedSecret) return;
    void startCallWithSecret(loom.focusedSecret);
  };

  const goOpenChat = (spaceId: string) => {
    showChat();
    void loom.onOpenSpace(spaceId);
  };

  const goOpenCall = (spaceId: string) => {
    showChat();
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
    setSettingsOpen((open) => !open);
  };

  const loomChat =
    Boolean(call.boundSpaceSecret) && loom.focusedSecret === call.boundSpaceSecret;
  const callMessages: ChatMessage[] = loomChat
    ? loom.messages.map((m) => ({
        id: m.id,
        peerId: m.self ? '__self__' : m.author,
        displayName: m.author,
        text: m.kind === 'join' ? `${m.author} joined` : m.text,
        sentAt: m.ts,
      }))
    : call.webrtc.messages;

  const leaveCall = () => {
    call.onLeave();
    setRoomShellOpen(false);
  };

  const spaceCallBand =
    callSurface === 'space-call' ? buildSpaceCallBand(call, loom, leaveCall) : null;

  const spacesPane = (
    <PreviousSpacesList
      chats={loom.chats}
      displayName={loom.displayName}
      busy={loom.busy || call.busy}
      activeSpaceId={loom.focusedSpaceId}
      error={loom.error}
      spaceInput={loom.spaceInput}
      onSpaceInput={loom.setSpaceInput}
      onJoinSpace={loom.onJoinSpace}
      onOpenChat={goOpenChat}
      onOpenCall={goOpenCall}
      reach={reach}
    />
  );

  const paneProps = {
    chatPane,
    onChatPane: (pane: ChatPane) => {
      if (pane === 'spaces') showSpaces();
      else showChat();
    },
    spacesPane,
    startNew: {
      busy: loom.busy || call.busy,
      disabled: freshSoloChat,
      onNewChat: goNewChat,
    },
  };

  let workspace: ReactNode;
  if (callSurface === 'space-call') {
    workspace = (
      <SpaceView
        selfName={loom.displayName}
        personId={loom.personId}
        people={loom.people}
        reach={reach}
        inviteUrl={call.shareUrl || loom.inviteUrl}
        messages={loom.messages}
        error={loom.error}
        hasMoreOlder={loom.hasMoreOlder}
        loadingOlder={loom.loadingOlder}
        onLoadOlder={() => void loom.onLoadOlder()}
        onSend={(text) => void loom.onSend(text)}
        onCopyInvite={call.onCopyInvite}
        call={spaceCallBand}
        callBusy={loom.busy || call.busy}
        {...paneProps}
      />
    );
  } else if (loom.screen === 'space') {
    workspace = (
      <SpaceView
        selfName={loom.displayName}
        personId={loom.personId}
        people={loom.people}
        reach={reach}
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
        {...paneProps}
      />
    );
  } else {
    workspace = <WorkspaceIdle {...paneProps} />;
  }

  let body: ReactNode;
  if (callSurface === 'room-shell') {
    body = (
      <CallShell
        displayName={loom.displayName.trim() || 'Guest'}
        personId={loom.personId}
        people={loom.people}
        reach={reach}
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
        screenSharing={call.media.screenSharing}
        screenShareSupported={call.media.screenShareSupported}
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
        onToggleScreenShare={() => void call.media.toggleScreenShare()}
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
  } else if (loom.screen === 'thread') {
    body = (
      <Lobby
        displayName={loom.displayName}
        personId={loom.personId}
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
      <AppWorkShell
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
        workspace={workspace}
      />
    );
  }

  return (
    <div data-testid="app-home" className="flex h-full min-h-0 flex-col">
      <AppNav
        place={place}
        onHome={goHome}
        onSettings={openSettings}
        settingsOpen={settingsOpen}
        appearActive={Boolean(reach.selfPersonId && reach.appearActive && reach.tabVisible)}
        onToggleAppearActive={reach.selfPersonId ? reach.onToggleAppearActive : undefined}
      />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{body}</main>
        {callSurface === 'background' ? (
          <InCallBar
            statusLabel={call.statusLabel}
            onReturn={returnToCall}
            onLeave={leaveCall}
          />
        ) : null}
        <AppSettingsDrawer
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          loom={loom}
          presence={
            presence.selfPersonId
              ? {
                  appearActive: presence.appearActive,
                  tabVisible: presence.tabVisible,
                  onToggle: presence.toggleAppearActive,
                }
              : null
          }
          pwa={pwa}
          call={call}
          onAfterLeaveShell={() => setRoomShellOpen(false)}
        />
      </div>
    </div>
  );
}
