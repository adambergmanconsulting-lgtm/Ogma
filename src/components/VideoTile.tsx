import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MicOff, Pin, User, Volume2 } from 'lucide-react';
import { isAudioInputOff } from '../domain/media/audioInput';
import {
  isRemoteAudioUnlocked,
  onRemoteAudioUnlocked,
  registerRemotePlayer,
  unlockRemoteAudio,
} from '../domain/media/remoteAudioUnlock';
import { MicLevel } from './MicLevel';
import { PersonName } from './PersonName';

interface VideoTileProps {
  stream: MediaStream | null;
  label: string;
  /** This vault's id when `label` is that person. */
  selfName?: string;
  personId?: string | null;
  /** Local tile: mute playback to avoid echo. */
  muted?: boolean;
  mirrored?: boolean;
  /** Screen share shows the whole picture. Camera fills the tile. */
  fit?: 'cover' | 'contain';
  micOff?: boolean;
  showMicLevel?: boolean;
  pinned?: boolean;
  onTogglePin?: () => void;
  applyAudioOutput?: (el: HTMLMediaElement | null) => void | Promise<void>;
  /** Camera-only chrome, drawn on this tile. */
  overlay?: ReactNode;
}

function useAudioInputOff(stream: MediaStream | null): boolean {
  const [off, setOff] = useState(() => isAudioInputOff(stream));

  useEffect(() => {
    if (!stream) {
      setOff(true);
      return;
    }
    const attached = new Set<MediaStreamTrack>();
    const sync = () => {
      for (const t of stream.getAudioTracks()) {
        if (attached.has(t)) continue;
        attached.add(t);
        t.addEventListener('mute', sync);
        t.addEventListener('unmute', sync);
        t.addEventListener('ended', sync);
      }
      setOff(isAudioInputOff(stream));
    };
    sync();
    stream.addEventListener('addtrack', sync);
    stream.addEventListener('removetrack', sync);
    return () => {
      stream.removeEventListener('addtrack', sync);
      stream.removeEventListener('removetrack', sync);
      for (const t of attached) {
        t.removeEventListener('mute', sync);
        t.removeEventListener('unmute', sync);
        t.removeEventListener('ended', sync);
      }
    };
  }, [stream]);

  return off;
}

export function VideoTile({
  stream,
  label,
  selfName,
  personId,
  muted = false,
  mirrored = false,
  fit = 'cover',
  micOff,
  showMicLevel = false,
  pinned = false,
  onTogglePin,
  applyAudioOutput,
  overlay,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [needsUnlock, setNeedsUnlock] = useState(
    () => !muted && !isRemoteAudioUnlocked(),
  );
  const derivedMicOff = useAudioInputOff(stream);
  const effectiveMicOff = micOff ?? derivedMicOff;
  const hasVideo = Boolean(stream?.getVideoTracks().some((t) => t.readyState === 'live'));
  const wantsRemoteSound = !muted;

  useEffect(() => {
    if (muted) return;
    return onRemoteAudioUnlocked(() => setNeedsUnlock(false));
  }, [muted]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (!stream) {
      el.srcObject = null;
      return;
    }

    el.srcObject = stream;

    if (muted) {
      el.muted = true;
      void el.play().catch(() => undefined);
      return;
    }

    // Remote: start muted for autoplay, then unmute after unlock gesture.
    const unlocked = isRemoteAudioUnlocked();
    el.muted = !unlocked;
    setNeedsUnlock(!unlocked);
    void el.play().catch(() => undefined);
    void applyAudioOutput?.(el);

    const unregister = registerRemotePlayer(el);
    return unregister;
  }, [applyAudioOutput, muted, stream]);

  const onEnableSound = () => {
    void unlockRemoteAudio().then(() => {
      setNeedsUnlock(false);
      const el = videoRef.current;
      if (el) {
        el.muted = false;
        void el.play().catch(() => undefined);
      }
    });
  };

  return (
    <div className="relative min-h-0 overflow-hidden rounded-xl bg-[color:var(--color-panel)] ring-1 ring-[color:var(--color-line)]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted || needsUnlock}
        className={[
          'h-full w-full rounded-xl',
          fit === 'contain' ? 'object-contain' : 'object-cover',
          mirrored ? 'scale-x-[-1]' : '',
          hasVideo ? '' : 'opacity-0',
        ].join(' ')}
      />
      {overlay ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-2">{overlay}</div>
      ) : null}
      {!hasVideo ? (
        <div className="absolute inset-0 flex items-center justify-center text-[color:var(--color-muted)]">
          <User className="h-12 w-12 opacity-50" />
        </div>
      ) : null}
      {wantsRemoteSound && needsUnlock ? (
        <button
          type="button"
          data-testid="enable-sound"
          onClick={onEnableSound}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/55 px-4 text-center backdrop-blur-[1px]"
        >
          <Volume2 className="h-10 w-10 text-[color:var(--color-gold)]" aria-hidden />
          <span className="text-sm font-semibold text-white">Enable sound</span>
        </button>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
        <PersonName
          name={label}
          selfName={selfName}
          personId={personId}
          truncate
          className="text-sm font-medium"
        />
        <div className="flex shrink-0 items-center gap-2">
          {onTogglePin ? (
            <button
              type="button"
              data-testid="toggle-pin"
              aria-label={pinned ? 'Unpin video' : 'Pin video'}
              title={pinned ? 'Unpin' : 'Pin'}
              aria-pressed={pinned}
              onClick={onTogglePin}
              className={[
                'rounded p-1 transition',
                pinned
                  ? 'bg-[color:var(--color-gold)] text-[color:var(--color-on-gold)]'
                  : 'bg-black/40 text-white hover:bg-black/60',
              ].join(' ')}
            >
              <Pin className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
          {showMicLevel ? <MicLevel stream={stream} active={!effectiveMicOff} /> : null}
          {effectiveMicOff ? (
            <span data-testid="mic-off" title="Microphone off" aria-label="Microphone off">
              <MicOff className="h-4 w-4 text-[color:var(--color-danger)]" aria-hidden />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
