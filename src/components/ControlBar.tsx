import type { ReactNode } from 'react';
import {
  LayoutGrid,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  Settings,
  Sparkles,
  Video,
  VideoOff,
} from 'lucide-react';

interface ControlBarProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  backgroundBlur?: boolean;
  backgroundBlurSupported?: boolean;
  /** Omit when chat is already the primary canvas (space shell). */
  chatOpen?: boolean;
  showAllVideos?: boolean;
  /** Tighter chrome for the space video pane. */
  dense?: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleBackgroundBlur?: () => void;
  onToggleChat?: () => void;
  onToggleShowAllVideos?: () => void;
  onOpenSettings: () => void;
  onLeave: () => void;
}

function CtrlButton({
  onClick,
  active,
  danger,
  label,
  children,
  testId,
  dense,
}: {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  label: string;
  children: ReactNode;
  testId?: string;
  dense?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-testid={testId}
      onClick={onClick}
      className={[
        'flex items-center justify-center rounded-full transition',
        dense ? 'h-9 w-9' : 'h-12 w-12',
        danger
          ? 'bg-[color:var(--color-danger)] text-white hover:brightness-110'
          : active
            ? 'bg-[color:var(--color-gold)] text-[color:var(--color-on-gold)] hover:bg-[color:var(--color-honey)]'
            : 'bg-[color:var(--color-panel-2)] text-[color:var(--color-ink)] ring-1 ring-[color:var(--color-line)] hover:brightness-110',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export function ControlBar(props: ControlBarProps) {
  const dense = Boolean(props.dense);
  const icon = dense ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div
      className={[
        'flex flex-wrap items-center justify-center',
        dense ? 'gap-1.5 px-2 py-1.5' : 'gap-2 px-3 py-3 md:gap-3',
      ].join(' ')}
    >
      <CtrlButton
        dense={dense}
        label={props.micEnabled ? 'Mute microphone' : 'Unmute microphone'}
        onClick={props.onToggleMic}
        active={!props.micEnabled}
        testId="toggle-mic"
      >
        {props.micEnabled ? <Mic className={icon} /> : <MicOff className={icon} />}
      </CtrlButton>
      <CtrlButton
        dense={dense}
        label={props.cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
        onClick={props.onToggleCamera}
        active={!props.cameraEnabled}
      >
        {props.cameraEnabled ? <Video className={icon} /> : <VideoOff className={icon} />}
      </CtrlButton>
      {props.backgroundBlurSupported && props.onToggleBackgroundBlur ? (
        <CtrlButton
          dense={dense}
          label={props.backgroundBlur ? 'Clear background' : 'Blur background'}
          onClick={props.onToggleBackgroundBlur}
          active={props.backgroundBlur}
          testId="toggle-background-blur"
        >
          <Sparkles className={icon} />
        </CtrlButton>
      ) : null}
      {props.onToggleChat ? (
        <CtrlButton
          dense={dense}
          label={props.chatOpen ? 'Hide chat' : 'Show chat'}
          onClick={props.onToggleChat}
          active={props.chatOpen}
        >
          <span data-testid="toggle-chat">
            <MessageSquare className={icon} />
          </span>
        </CtrlButton>
      ) : null}
      {props.onToggleShowAllVideos ? (
        <CtrlButton
          dense={dense}
          label={props.showAllVideos ? 'Speaker video only' : 'Show all videos'}
          onClick={props.onToggleShowAllVideos}
          active={props.showAllVideos}
          testId="toggle-show-all-videos"
        >
          <LayoutGrid className={icon} />
        </CtrlButton>
      ) : null}
      <CtrlButton dense={dense} label="Settings" onClick={props.onOpenSettings}>
        <Settings className={icon} />
      </CtrlButton>
      <CtrlButton dense={dense} label="Leave call" onClick={props.onLeave} danger>
        <span data-testid="leave-call">
          <PhoneOff className={icon} />
        </span>
      </CtrlButton>
    </div>
  );
}
