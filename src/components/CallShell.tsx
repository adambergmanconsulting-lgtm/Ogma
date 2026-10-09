import { useEffect } from 'react';
import { unlockRemoteAudio } from '../domain/media/remoteAudioUnlock';
import type { ShareResult } from '../domain/signaling/share';
import type { ChatMessage, RemotePeer } from '../domain/types';
import type { MediaDeviceOption } from '../domain/types';
import { ChatDrawer } from './ChatDrawer';
import { ControlBar } from './ControlBar';
import { InviteLinkBar } from './InviteLinkBar';
import { OghamMark } from './OghamMark';
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
  drawer: Drawer;
  micEnabled: boolean;
  cameraEnabled: boolean;
  videoDevices: MediaDeviceOption[];
  audioDevices: MediaDeviceOption[];
  outputDevices: MediaDeviceOption[];
  videoDeviceId: string;
  audioDeviceId: string;
  audioOutputId: string;
  onCopyInvite: () => Promise<ShareResult>;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleChat: () => void;
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
      <header className="border-b border-[color:var(--color-line)] bg-[color:var(--color-panel)]/80 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <OghamMark className="h-4 w-auto shrink-0 text-[color:var(--color-gold)]" />
            <span className="shrink-0 font-[family-name:var(--font-display)] text-base tracking-tight sm:text-lg">
              Ogma
            </span>
            <span
              data-testid="connection-label"
              className="min-w-0 truncate text-xs text-[color:var(--color-muted)]"
            >
              {props.connectionLabel}
              {props.roomCode ? (
                <>
                  {' · '}
                  <span data-testid="room-code">Room {props.roomCode}</span>
                </>
              ) : null}
            </span>
          </div>
        </div>
        {props.inviteUrl ? (
          <div className={waitingAlone ? 'invite-link-bar-wait' : undefined}>
            <InviteLinkBar inviteUrl={props.inviteUrl} onCopyInvite={props.onCopyInvite} />
          </div>
        ) : null}
        {props.linkHint ? (
          <p
            role="status"
            className="mt-1.5 text-[11px] text-[color:var(--color-muted)]"
          >
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
            applyAudioOutput={props.applyAudioOutput}
          />
          {props.error ? (
            <p className="px-4 pb-2 text-sm text-[color:var(--color-danger)]">{props.error}</p>
          ) : null}
          <ControlBar
            micEnabled={props.micEnabled}
            cameraEnabled={props.cameraEnabled}
            chatOpen={props.drawer === 'chat'}
            localStream={props.localStream}
            onToggleMic={props.onToggleMic}
            onToggleCamera={props.onToggleCamera}
            onToggleChat={props.onToggleChat}
            onOpenSettings={props.onOpenSettings}
            onLeave={props.onLeave}
          />
        </div>

        <ChatDrawer
          open={props.drawer === 'chat'}
          messages={props.messages}
          selfId={props.selfId}
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
