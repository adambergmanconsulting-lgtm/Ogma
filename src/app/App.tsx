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
import { shouldEndLocalCallOnWire, shouldOfferStartCall } from '../domain/loom/callRing';
import { systemLineLabel } from '../domain/loom/systemLine';
import { isFreshSoloChat } from '../domain/loom/spaceIndex';
import { parseRoomIdFromLocation } from '../domain/signaling/room';
import { threadSecretFromSpace } from '../domain/signaling/threadFromSpace';
import { installAudioUnlockOnGesture } from '../domain/shell/audioUnlock';
import {
  readWelcomeDismissed,
  shouldOfferWelcome,
  writeWelcomeDismissed,
} from '../domain/shell/pwaInstall';
import { onAppBecameVisible } from '../domain/shell/tabAlert';
import { resolveCallSurface } from '../domain/thread/callSurface';
import type { ChatMessage } from '../domain/types';
import { IncomingCallBanner } from '../components/IncomingCallBanner';
import { PwaUpdateBanner } from '../components/PwaUpdateBanner';
import { AppSettingsDrawer } from './AppSettingsDrawer';
import { buildSpaceCallBand } from './buildSpaceCallBand';
import { useCallController } from './useCallController';
import { useLoomController } from './useLoomController';
import { usePersonPresence } from './usePersonPresence';
import { usePwaInstall } from './usePwaInstall';
import { usePwaUpdate } from './usePwaUpdate';
import { useSpaceCallRing } from './useSpaceCallRing';

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
  /** Space secret All was opened against; a different focused space clears All preference. */
  const preferSpacesSecret = useRef<string | null>(null);
  const [chatPane, setChatPane] = useState<ChatPane>('spaces');
  const [joinFocusNonce, setJoinFocusNonce] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => readWelcomeDismissed());
  /** Room-only CallShell visible (false after soft-nav home). */
  const [roomShellOpen, setRoomShellOpen] = useState(true);
  const [acceptBusy, setAcceptBusy] = useState(false);
  const onScreenShareChangeRef = useRef<(sharing: boolean) => void>(() => undefined);
  const call = useCallController({
    displayName: loom.displayName,
    /** URL room sync and Call entry once the vault is open (not only on Thread screen). */
    enabled: loom.unlocked,
    onScreenShareChange: (sharing) => onScreenShareChangeRef.current(sharing),
  });
  const callRing = useSpaceCallRing({
    displayName: loom.displayName,
    inCall: call.inCall,
    spaceSecret: loom.spaceSecret,
  });
  const pwaUpdate = usePwaUpdate({ vaultReveal: loom.screen === 'reveal' });

  useEffect(() => installAudioUnlockOnGesture(), []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      onAppBecameVisible({ incomingCall: Boolean(callRing.incomingCall) });
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [callRing.incomingCall]);

  onScreenShareChangeRef.current = (sharing) => {
    const secret = call.boundSpaceSecret ?? loom.focusedSecret;
    const spaceId =
      (secret ? loom.spaceIdForSecret(secret) : null) ?? loom.focusedSpaceId;
    void loom.sealSystemLine(
      sharing ? 'screen-share' : 'screen-share-end',
      spaceId,
      secret,
    );
  };

  /** Hang up when a peer sends call-end for this space’s Call (refs avoid stale handlers). */
  const onRemoteCallEndRef = useRef<(spaceId: string) => void>(() => undefined);
  onRemoteCallEndRef.current = (spaceId: string) => {
    const boundId = call.boundSpaceSecret
      ? loom.spaceIdForSecret(call.boundSpaceSecret)
      : null;
    if (
      !shouldEndLocalCallOnWire({
        endedSpaceId: spaceId,
        inCall: call.inCall,
        callingSpaceId: callRing.callingSpaceId,
        boundSpaceId: boundId,
      })
    ) {
      return;
    }
    callRing.endRingForSpace(spaceId);
    call.onLeave();
    setRoomShellOpen(false);
  };

  useEffect(() => {
    loom.setCallRingHandlers({
      getCallAnnounce: callRing.getCallAnnounce,
      onCall: callRing.onCallWire,
      onCallEnd: (spaceId) => {
        callRing.onCallEndWire(spaceId);
        onRemoteCallEndRef.current(spaceId);
      },
    });
    return () => loom.setCallRingHandlers(null);
  }, [
    loom.setCallRingHandlers,
    callRing.getCallAnnounce,
    callRing.onCallWire,
    callRing.onCallEndWire,
  ]);

  const hasLocalChats = loom.chats.length > 0;
  const welcome = shouldOfferWelcome({
    installMode: pwa.mode,
    dismissed: welcomeDismissed,
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

  // Opening a different space always shows chat. Prefer All only while the same space stays focused.
  useEffect(() => {
    const secret = loom.focusedSecret;
    if (!secret) {
      preferSpacesSecret.current = null;
      return;
    }
    if (preferSpaces.current && preferSpacesSecret.current === secret) return;
    preferSpaces.current = false;
    preferSpacesSecret.current = secret;
    setChatPane('chat');
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
        onCreateVault={(name) => void loom.onCreateVault(name)}
      />
    );
  }

  if (loom.screen === 'unlock') {
    return (
      <VaultUnlock
        busy={loom.busy}
        error={loom.error}
        onUnlock={(key) => void loom.onUnlockVault(key)}
        onCreateNew={() => loom.onSwitchVault()}
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
    preferSpacesSecret.current = loom.focusedSecret;
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

  const startCallWithSecret = async (secret: string, spaceId?: string | null) => {
    const roomId = await threadSecretFromSpace(secret);
    const id = spaceId ?? loom.focusedSpaceId ?? loom.spaceIdForSecret(secret);
    const author = loom.displayName.trim() || 'Guest';
    if (id) {
      callRing.markCalling(id);
      // Ring before getUserMedia — permission UI can take many seconds.
      loom.announceCall(id, author);
    }
    try {
      await call.startCall(roomId, secret);
      if (id) loom.announceCall(id, author);
      void loom.sealSystemLine('call-start', id, secret);
    } catch {
      if (id) {
        loom.announceCallEnd(id);
        callRing.endRingForSpace(id);
      }
    }
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

  const goJoin = () => {
    showSpaces();
    setJoinFocusNonce((n) => n + 1);
  };

  const acceptIncomingCall = () => {
    const incoming = callRing.incomingCall;
    if (!incoming || call.inCall || acceptBusy) return;
    setAcceptBusy(true);
    callRing.setAcceptError(null);
    void (async () => {
      try {
        // Start A/V under the Accept click (user activation). Do not await Loom
        // open first — that burns the gesture and private windows then block media.
        callRing.markCalling(incoming.spaceId);
        const roomId =
          incoming.roomId || (await threadSecretFromSpace(incoming.spaceSecret));
        await call.startCall(roomId, incoming.spaceSecret);
        loom.announceCall(incoming.spaceId, loom.displayName.trim() || 'Guest');
        callRing.dismissIncomingCall();
        if (loom.focusedSecret !== incoming.spaceSecret) {
          await loom.onOpenSpaceSecret(incoming.spaceSecret);
        }
      } catch (e) {
        callRing.clearCalling(incoming.spaceId);
        callRing.setAcceptError(
          (e instanceof Error && e.message) ||
            call.media.error ||
            'Could not join the call. Allow camera and microphone, then Accept again.',
        );
      } finally {
        setAcceptBusy(false);
      }
    })();
  };

  /** Upgrade open space to Call — or Accept if a ring is already up for this chat. */
  const goCall = () => {
    if (call.inCall || loom.busy || !loom.focusedSecret) return;
    const incoming = callRing.incomingCall;
    if (incoming && incoming.spaceSecret === loom.focusedSecret) {
      acceptIncomingCall();
      return;
    }
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
    const incoming = callRing.incomingCall;
    if (incoming?.spaceId === spaceId) {
      acceptIncomingCall();
      return;
    }
    void (async () => {
      const secret = await loom.onOpenSpace(spaceId);
      if (!secret) return;
      await startCallWithSecret(secret, spaceId);
    })();
  };

  const openSettings = () => {
    setSettingsOpen((open) => !open);
  };

  const openSettingsFromWelcome = () => {
    setSettingsOpen(true);
  };

  const loomChat =
    Boolean(call.boundSpaceSecret) && loom.focusedSecret === call.boundSpaceSecret;
  const callMessages: ChatMessage[] = loomChat
    ? loom.messages.map((m) => ({
        id: m.id,
        peerId: m.self ? '__self__' : m.author,
        displayName: m.author,
        text: m.kind === 'text' ? m.text : systemLineLabel(m.author, m.kind),
        sentAt: m.ts,
      }))
    : call.webrtc.messages;

  const leaveCall = () => {
    const endId =
      callRing.callingSpaceId ??
      (call.boundSpaceSecret ? loom.spaceIdForSecret(call.boundSpaceSecret) : null) ??
      loom.focusedSpaceId;
    const endSecret = call.boundSpaceSecret ?? loom.focusedSecret;
    if (endId) {
      void loom.sealSystemLine('call-end', endId, endSecret);
      loom.announceCallEnd(endId);
      callRing.endRingForSpace(endId);
    }
    call.onLeave();
    setRoomShellOpen(false);
  };

  const offerStartCall = shouldOfferStartCall({
    inCall: call.inCall,
    hasIncomingCall: Boolean(callRing.incomingCall),
  });

  const incomingBanner =
    callRing.incomingCall && !call.inCall ? (
      <IncomingCallBanner
        author={callRing.incomingCall.author}
        selfName={loom.displayName}
        personId={loom.personId}
        busy={acceptBusy}
        error={callRing.acceptError || call.media.error}
        onAccept={acceptIncomingCall}
        onDismiss={callRing.dismissIncomingCall}
      />
    ) : null;

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
      joinFocusNonce={joinFocusNonce}
      onJoinSpace={() => {
        const invite = loom.onJoinSpace();
        if (!invite) return;
        if (invite.room) {
          call.offerInvite(invite.room, invite.space);
          loom.setScreen('thread');
          return;
        }
        if (invite.space) void loom.onOpenSpaceSecret(invite.space);
      }}
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
    chatTitle: loom.chatTitle,
    startNew: {
      busy: loom.busy || call.busy,
      disabled: freshSoloChat,
      onNewChat: goNewChat,
    },
    startJoin: {
      busy: loom.busy || call.busy,
      onJoin: goJoin,
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
        onEdit={(id, text) => void loom.onEdit(id, text)}
        onCopyInvite={call.onCopyInvite}
        call={spaceCallBand}
        callBusy={loom.busy || call.busy}
        incomingCall={incomingBanner}
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
        onEdit={(id, text) => void loom.onEdit(id, text)}
        onCopyInvite={loom.onCopyInvite}
        onStartCall={offerStartCall ? goCall : undefined}
        callBusy={loom.busy || call.busy || acceptBusy}
        incomingCall={incomingBanner}
        {...paneProps}
      />
    );
  } else {
    workspace = (
      <>
        {incomingBanner}
        <WorkspaceIdle {...paneProps} />
      </>
    );
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
        linkQualityNotice={call.linkQualityNotice}
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
          void (async () => {
            const space = await call.onJoin();
            if (space) await loom.onOpenSpaceSecret(space);
            else setRoomShellOpen(true);
          })();
        }}
      />
    );
  } else {
    body = (
      <AppWorkShell
        welcome={welcome}
        onOpenSettings={openSettingsFromWelcome}
        onDismissWelcome={() => {
          writeWelcomeDismissed();
          setWelcomeDismissed(true);
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
      {pwaUpdate.updateReady ? (
        <PwaUpdateBanner onReload={pwaUpdate.applyUpdate} />
      ) : null}
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
          call={{ inCall: call.inCall, onLeave: leaveCall }}
          onAfterLeaveShell={() => setRoomShellOpen(false)}
        />
      </div>
    </div>
  );
}
