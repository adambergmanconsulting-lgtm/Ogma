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
  chatOpen: boolean;
  showAllVideos?: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleBackgroundBlur?: () => void;
  onToggleChat: () => void;
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
}: {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  label: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-testid={testId}
      onClick={onClick}
      className={[
        'flex h-12 w-12 items-center justify-center rounded-full transition',
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
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-3 md:gap-3">
      <CtrlButton
        label={props.micEnabled ? 'Mute microphone' : 'Unmute microphone'}
        onClick={props.onToggleMic}
        active={!props.micEnabled}
        testId="toggle-mic"
      >
        {props.micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </CtrlButton>
      <CtrlButton
        label={props.cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
        onClick={props.onToggleCamera}
        active={!props.cameraEnabled}
      >
        {props.cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </CtrlButton>
      {props.backgroundBlurSupported && props.onToggleBackgroundBlur ? (
        <CtrlButton
          label={props.backgroundBlur ? 'Clear background' : 'Blur background'}
          onClick={props.onToggleBackgroundBlur}
          active={props.backgroundBlur}
          testId="toggle-background-blur"
        >
          <Sparkles className="h-5 w-5" />
        </CtrlButton>
      ) : null}
      <CtrlButton
        label={props.chatOpen ? 'Hide chat' : 'Show chat'}
        onClick={props.onToggleChat}
        active={props.chatOpen}
      >
        <span data-testid="toggle-chat">
          <MessageSquare className="h-5 w-5" />
        </span>
      </CtrlButton>
      {props.onToggleShowAllVideos ? (
        <CtrlButton
          label={props.showAllVideos ? 'Speaker video only' : 'Show all videos'}
          onClick={props.onToggleShowAllVideos}
          active={props.showAllVideos}
          testId="toggle-show-all-videos"
        >
          <LayoutGrid className="h-5 w-5" />
        </CtrlButton>
      ) : null}
      <CtrlButton label="Settings" onClick={props.onOpenSettings}>
        <Settings className="h-5 w-5" />
      </CtrlButton>
      <CtrlButton label="Leave call" onClick={props.onLeave} danger>
        <span data-testid="leave-call">
          <PhoneOff className="h-5 w-5" />
        </span>
      </CtrlButton>
    </div>
  );
}
