import { useEffect } from 'react';
import { unlockRemoteAudio } from '../domain/media/remoteAudioUnlock';
import type { ShareResult } from '../domain/signaling/share';
import type { ChatMessage, RemotePeer } from '../domain/types';
import type { MediaDeviceOption } from '../domain/types';
import { ChatDrawer } from './ChatDrawer';
import { ControlBar } from './ControlBar';
import { InviteLinkBar } from './InviteLinkBar';
import { SettingsDrawer } from './SettingsDrawer';
import { VideoGrid } from './VideoGrid';

type Drawer = 'none' | 'chat' | 'settings';

interface CallShellProps {
  displayName: string;
  connectionLabel: string;
  roomCode: string;
  inviteUrl: string;
  linkHint: string | null;
  error: string | null;
  localStream: MediaStream | null;
  localMicOff: boolean;
  remotePeers: RemotePeer[];
  messages: ChatMessage[];
  selfId: string;
  hasMoreOlder?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
  drawer: Drawer;
  micEnabled: boolean;
  cameraEnabled: boolean;
  backgroundBlur?: boolean;
  backgroundBlurSupported?: boolean;
  pinnedPeerIds?: string[];
  showAllVideos?: boolean;
  capacityWarning?: string | null;
  videoDevices: MediaDeviceOption[];
  audioDevices: MediaDeviceOption[];
  outputDevices: MediaDeviceOption[];
  videoDeviceId: string;
  audioDeviceId: string;
  audioOutputId: string;
  onCopyInvite: () => Promise<ShareResult>;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleBackgroundBlur?: () => void;
  onToggleChat: () => void;
  onTogglePin?: (peerId: string) => void;
  onToggleShowAllVideos?: () => void;
  onOpenSettings: () => void;
  onCloseDrawer: () => void;
  onLeave: () => void;
  onSendChat: (text: string) => void;
  onVideoChange: (id: string) => void;
  onAudioChange: (id: string) => void;
  onOutputChange: (id: string) => void;
  applyAudioOutput: (el: HTMLMediaElement | null) => void | Promise<void>;
}

export function CallShell(props: CallShellProps) {
  const waitingAlone = props.remotePeers.length === 0;

  // Any click in the call shell counts as the autoplay gesture (not only PiP).
  useEffect(() => {
    const onPointer = () => {
      void unlockRemoteAudio();
    };
    window.addEventListener('pointerdown', onPointer, { once: true, capture: true });
    return () => window.removeEventListener('pointerdown', onPointer, true);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="app-gutter-x pt-3 pb-1">
        <div className="flex min-w-0 items-center gap-2 text-xs text-[color:var(--color-muted)]">
          <span data-testid="connection-label" className="min-w-0 truncate">
            {props.connectionLabel}
          </span>
          {props.roomCode ? (
            <span data-testid="room-code" className="shrink-0 tabular-nums">
              {props.roomCode}
            </span>
          ) : null}
        </div>
        {props.inviteUrl && waitingAlone ? (
          <div className="invite-link-bar-wait mt-1.5">
            <InviteLinkBar inviteUrl={props.inviteUrl} onCopyInvite={props.onCopyInvite} />
          </div>
        ) : null}
        {props.linkHint ? (
          <p role="status" className="mt-1 text-[11px] text-[color:var(--color-muted)]">
            {props.linkHint}
          </p>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <VideoGrid
            localStream={props.localStream}
            localLabel={props.displayName}
            localMicOff={props.localMicOff}
            remotePeers={props.remotePeers}
            pinnedPeerIds={props.pinnedPeerIds}
            onTogglePin={props.onTogglePin}
            applyAudioOutput={props.applyAudioOutput}
          />
          {props.capacityWarning ? (
            <p
              role="status"
              data-testid="capacity-warning"
              className="app-gutter-x pb-1 text-xs text-[color:var(--color-muted)]"
            >
              {props.capacityWarning}
            </p>
          ) : null}
          {props.error ? (
            <p className="app-gutter-x pb-2 text-sm text-[color:var(--color-danger)]">{props.error}</p>
          ) : null}
          <ControlBar
            micEnabled={props.micEnabled}
            cameraEnabled={props.cameraEnabled}
            backgroundBlur={props.backgroundBlur}
            backgroundBlurSupported={props.backgroundBlurSupported}
            chatOpen={props.drawer === 'chat'}
            showAllVideos={props.showAllVideos}
            onToggleMic={props.onToggleMic}
            onToggleCamera={props.onToggleCamera}
            onToggleBackgroundBlur={props.onToggleBackgroundBlur}
            onToggleChat={props.onToggleChat}
            onToggleShowAllVideos={
              !waitingAlone ? props.onToggleShowAllVideos : undefined
            }
            onOpenSettings={props.onOpenSettings}
            onLeave={props.onLeave}
          />
        </div>

        <ChatDrawer
          open={props.drawer === 'chat'}
          messages={props.messages}
          selfId={props.selfId}
          hasMoreOlder={props.hasMoreOlder}
          loadingOlder={props.loadingOlder}
          onLoadOlder={props.onLoadOlder}
          onClose={props.onCloseDrawer}
          onSend={props.onSendChat}
        />
        <SettingsDrawer
          open={props.drawer === 'settings'}
          videoDevices={props.videoDevices}
          audioDevices={props.audioDevices}
          outputDevices={props.outputDevices}
          videoDeviceId={props.videoDeviceId}
          audioDeviceId={props.audioDeviceId}
          audioOutputId={props.audioOutputId}
          onClose={props.onCloseDrawer}
          onVideoChange={props.onVideoChange}
          onAudioChange={props.onAudioChange}
          onOutputChange={props.onOutputChange}
        />
      </div>
    </div>
  );
}
