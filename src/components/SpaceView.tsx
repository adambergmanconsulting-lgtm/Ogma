import { useEffect, useRef, useState } from 'react';
import { Phone, User } from 'lucide-react';
import { unlockRemoteAudio } from '../domain/media/remoteAudioUnlock';
import type { ShareResult } from '../domain/signaling/share';
import { ControlBar } from './ControlBar';
import { ChatMessageText } from './ChatMessageText';
import { InviteLinkBar } from './InviteLinkBar';
import { CollapsedRail, FoldButton } from './SpacePaneChrome';
import { SettingsDrawer } from './SettingsDrawer';
import type { SpaceCallBand } from './spaceCallBand';
import { VideoGrid } from './VideoGrid';

export type { SpaceCallBand } from './spaceCallBand';

export type SpaceMessageView = {
  id: string;
  author: string;
  text: string;
  ts: number;
  self: boolean;
};

interface SpaceViewProps {
  title: string;
  selfLabel: string;
  inviteUrl: string | null;
  messages: SpaceMessageView[];
  error: string | null;
  hasMoreOlder?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
  onSend: (text: string) => void;
  onCopyInvite: () => Promise<ShareResult>;
  onStartCall?: () => void;
  callBusy?: boolean;
  call?: SpaceCallBand | null;
}

export function SpaceView(props: SpaceViewProps) {
  const [draft, setDraft] = useState('');
  const [videoOpen, setVideoOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const call = props.call ?? null;
  const waitingAlone = Boolean(call && call.remotePeers.length === 0);
  const canFoldVideo = videoOpen && chatOpen;
  const canFoldChat = chatOpen && videoOpen;

  useEffect(() => {
    const lastId = props.messages[props.messages.length - 1]?.id ?? null;
    if (lastId && lastId !== lastMessageIdRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    lastMessageIdRef.current = lastId;
  }, [props.messages]);

  useEffect(() => {
    if (!call) return;
    const onPointer = () => {
      void unlockRemoteAudio();
    };
    window.addEventListener('pointerdown', onPointer, { once: true, capture: true });
    return () => window.removeEventListener('pointerdown', onPointer, true);
  }, [call]);

  useEffect(() => {
    if (call) setVideoOpen(true);
  }, [call]);

  const foldVideo = () => {
    if (canFoldVideo) setVideoOpen(false);
  };
  const foldChat = () => {
    if (canFoldChat) setChatOpen(false);
  };

  return (
    <div data-testid="space-view" className="relative flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {videoOpen ? (
          <aside
            data-testid="space-presence"
            className={[
              'flex shrink-0 flex-col border-b border-[color:var(--color-line)]/50 bg-[color:var(--color-panel)]/25 md:min-h-0 md:border-b-0 md:border-r',
              chatOpen ? 'min-h-[11rem] md:min-w-0 md:flex-1' : 'min-h-0 flex-1',
            ].join(' ')}
          >
            <header className="space-pane-pad shrink-0 border-b border-[color:var(--color-line)]/50 py-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <div className="min-w-0 flex-1 truncate text-xs text-[color:var(--color-muted)]">
                  {call ? (
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <span data-testid="connection-label" className="min-w-0 truncate">
                        {call.connectionLabel}
                      </span>
                      {call.roomCode ? (
                        <span data-testid="room-code" className="shrink-0 tabular-nums">
                          {call.roomCode}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span data-testid="space-mode-label" role="status">
                      Video off
                    </span>
                  )}
                </div>
                {!call && props.onStartCall ? (
                  <button
                    type="button"
                    data-testid="space-call"
                    disabled={props.callBusy}
                    onClick={props.onStartCall}
                    className="btn-primary btn-primary--sm inline-flex shrink-0 items-center gap-1"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden />
                    Call
                  </button>
                ) : null}
                <FoldButton
                  testId="space-fold-video"
                  label="Hide video"
                  edge="start"
                  disabled={!canFoldVideo}
                  onClick={foldVideo}
                />
              </div>
              {call?.capacityWarning ? (
                <p
                  role="status"
                  data-testid="capacity-warning"
                  className="mt-1 text-[11px] text-[color:var(--color-muted)]"
                >
                  {call.capacityWarning}
                </p>
              ) : null}
              {call?.error ? (
                <p className="mt-1 text-sm text-[color:var(--color-danger)]">{call.error}</p>
              ) : null}
              {call?.linkHint ? (
                <p role="status" className="mt-1 text-[11px] text-[color:var(--color-muted)]">
                  {call.linkHint}
                </p>
              ) : null}
            </header>

            <div className="space-pane-pad min-h-0 flex-1 overflow-hidden py-2">
              {call ? (
                <VideoGrid
                  compact
                  localStream={call.localStream}
                  localLabel={call.displayName}
                  localMicOff={call.localMicOff}
                  remotePeers={call.remotePeers}
                  pinnedPeerIds={call.pinnedPeerIds}
                  onTogglePin={call.onTogglePin}
                  applyAudioOutput={call.applyAudioOutput}
                />
              ) : (
                <div
                  data-testid="space-presence-idle"
                  className="flex h-full min-h-[8rem] flex-col items-center justify-center gap-1.5 rounded-lg bg-[color:var(--color-panel)]/80 ring-1 ring-[color:var(--color-line)]/60"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-panel-2)] text-[color:var(--color-muted)]">
                    <User className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="truncate px-3 text-sm font-medium">{props.selfLabel}</span>
                </div>
              )}
            </div>

            {call ? (
              <div className="shrink-0 border-t border-[color:var(--color-line)]/50">
                <ControlBar
                  dense
                  micEnabled={call.micEnabled}
                  cameraEnabled={call.cameraEnabled}
                  backgroundBlur={call.backgroundBlur}
                  backgroundBlurSupported={call.backgroundBlurSupported}
                  showAllVideos={call.showAllVideos}
                  onToggleMic={call.onToggleMic}
                  onToggleCamera={call.onToggleCamera}
                  onToggleBackgroundBlur={call.onToggleBackgroundBlur}
                  onToggleShowAllVideos={!waitingAlone ? call.onToggleShowAllVideos : undefined}
                  onOpenSettings={call.onOpenDevices}
                  onLeave={call.onLeave}
                />
              </div>
            ) : null}
          </aside>
        ) : (
          <CollapsedRail
            testId="space-presence-collapsed"
            expandTestId="space-expand-video"
            label="Video"
            edge="start"
            onExpand={() => setVideoOpen(true)}
            trailing={
              !call && props.onStartCall ? (
                <button
                  type="button"
                  data-testid="space-call"
                  disabled={props.callBusy}
                  onClick={props.onStartCall}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[color:var(--color-gold)] hover:bg-[color:var(--color-panel-2)] disabled:opacity-60"
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  Call
                </button>
              ) : call ? (
                <span data-testid="connection-label" className="truncate text-[11px] text-[color:var(--color-muted)]">
                  {call.connectionLabel}
                </span>
              ) : null
            }
          />
        )}

        {chatOpen ? (
          <section
            data-testid="space-chat"
            className={[
              'flex min-h-0 min-w-0 flex-col bg-[color:var(--color-panel)]/25',
              videoOpen ? 'flex-1 md:w-[min(22rem,38%)] md:max-w-sm md:flex-none' : 'flex-1',
            ].join(' ')}
          >
            <header className="space-pane-pad shrink-0 border-b border-[color:var(--color-line)]/50 py-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <h1 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight">
                  {props.title}
                </h1>
                <FoldButton
                  testId="space-fold-chat"
                  label="Hide chat"
                  edge="end"
                  disabled={!canFoldChat}
                  onClick={foldChat}
                />
              </div>
              {props.inviteUrl ? (
                <div className="mt-1.5">
                  <InviteLinkBar dense inviteUrl={props.inviteUrl} onCopyInvite={props.onCopyInvite} />
                </div>
              ) : null}
              {props.error ? (
                <p className="mt-1.5 text-sm text-[color:var(--color-danger)]">{props.error}</p>
              ) : null}
            </header>

            <div className="space-pane-pad min-h-0 flex-1 space-y-2 overflow-y-auto py-2">
              {props.hasMoreOlder ? (
                <div className="flex justify-center py-0.5">
                  <button
                    type="button"
                    data-testid="load-older"
                    disabled={props.loadingOlder}
                    onClick={() => props.onLoadOlder?.()}
                    className="btn-quiet"
                  >
                    {props.loadingOlder ? 'Loading…' : 'Load older'}
                  </button>
                </div>
              ) : null}
              {props.messages.length === 0 ? (
                <p className="pt-3 text-center text-xs leading-relaxed text-[color:var(--color-muted)]">
                  This chat stays here. Copy the invite to add people.
                </p>
              ) : (
                props.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[92%] text-[13px] leading-snug ${m.self ? 'ml-auto text-right' : ''}`}
                  >
                    {!m.self ? (
                      <div className="mb-0.5 text-[11px] text-[color:var(--color-muted)]">
                        {m.author}
                      </div>
                    ) : null}
                    <ChatMessageText text={m.text} />
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <form
              className="space-pane-pad mt-auto flex items-center gap-1.5 border-t border-[color:var(--color-line)]/50 py-2"
              onSubmit={(e) => {
                e.preventDefault();
                const text = draft.trim();
                if (!text) return;
                props.onSend(text);
                setDraft('');
              }}
            >
              <input
                data-testid="space-compose"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="field field--compact flex-1"
                aria-label="Message"
              />
              <button
                type="submit"
                data-testid="space-send"
                disabled={!draft.trim()}
                className="btn-primary btn-primary--sm"
              >
                Send
              </button>
            </form>
          </section>
        ) : (
          <CollapsedRail
            testId="space-chat-collapsed"
            expandTestId="space-expand-chat"
            label="Chat"
            onExpand={() => setChatOpen(true)}
            edge="end"
          />
        )}
      </div>

      {call?.devicesOpen ? (
        <div className="absolute inset-y-0 right-0 z-20 flex max-w-full">
          <button
            type="button"
            aria-label="Close devices"
            className="min-w-0 flex-1 bg-black/20"
            onClick={call.onCloseDevices}
          />
          <SettingsDrawer
            open
            videoDevices={call.videoDevices}
            audioDevices={call.audioDevices}
            outputDevices={call.outputDevices}
            videoDeviceId={call.videoDeviceId}
            audioDeviceId={call.audioDeviceId}
            audioOutputId={call.audioOutputId}
            privacyBackdropSelectable={call.privacyBackdropSelectable}
            privacyBackdropId={call.privacyBackdropId}
            onPrivacyBackdropChange={call.onPrivacyBackdropChange}
            maskEdgeCut={call.maskEdgeCut}
            onMaskEdgeCutChange={call.onMaskEdgeCutChange}
            onClose={call.onCloseDevices}
            onVideoChange={call.onVideoChange}
            onAudioChange={call.onAudioChange}
            onOutputChange={call.onOutputChange}
          />
        </div>
      ) : null}
    </div>
  );
}
