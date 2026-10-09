import type { ChatMessage, RemotePeer } from '../domain/types';
import type { MediaDeviceOption } from '../domain/types';
import { ChatDrawer } from './ChatDrawer';
import { ControlBar } from './ControlBar';
import { OghamMark } from './OghamMark';
import { SettingsDrawer } from './SettingsDrawer';
import { VideoGrid } from './VideoGrid';

type Drawer = 'none' | 'chat' | 'settings';

interface CallShellProps {
  displayName: string;
  connectionLabel: string;
  roomCode: string;
  inviteUrl: string;
  linkHint: string;
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
  onCopyInvite: () => void;
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
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-col gap-2 border-b border-[color:var(--color-line)] bg-[color:var(--color-panel)]/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-[family-name:var(--font-display)] text-xl tracking-tight">
              <OghamMark className="h-5 w-auto shrink-0 text-[color:var(--color-gold)]" />
              <span>Ogma</span>
            </div>
            <div
              data-testid="connection-label"
              className="truncate text-xs text-[color:var(--color-muted)]"
            >
              {props.connectionLabel}
              {props.roomCode ? (
                <>
                  {' · '}
                  <span data-testid="room-code">Room {props.roomCode}</span>
                </>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            data-testid="share-link"
            className="shrink-0 rounded-lg border border-[color:var(--color-line)] px-3 py-1.5 text-xs hover:bg-[color:var(--color-panel-2)]"
            onClick={props.onCopyInvite}
          >
            Copy invite link
          </button>
        </div>
        {props.inviteUrl ? (
          <label className="block space-y-1">
            <span className="text-[11px] text-[color:var(--color-muted)]">
              Invite link (send this — it is the room)
            </span>
            <input
              data-testid="invite-url"
              readOnly
              value={props.inviteUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full truncate rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-panel-2)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-ink)] outline-none focus:border-[color:var(--color-gold)]"
            />
          </label>
        ) : null}
        <p className="text-[11px] text-[color:var(--color-muted)]">{props.linkHint}</p>
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
