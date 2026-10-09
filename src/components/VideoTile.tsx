import { useEffect, useRef } from 'react';
import { MicOff, User } from 'lucide-react';

interface VideoTileProps {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  mirrored?: boolean;
  micOff?: boolean;
  applyAudioOutput?: (el: HTMLMediaElement | null) => void | Promise<void>;
}

export function VideoTile({
  stream,
  label,
  muted = false,
  mirrored = false,
  micOff = false,
  applyAudioOutput,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream;
    void applyAudioOutput?.(el);
  }, [applyAudioOutput, stream]);

  return (
    <div className="relative min-h-0 overflow-hidden rounded-xl bg-[color:var(--color-panel)] ring-1 ring-[color:var(--color-line)]">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`h-full w-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex h-full min-h-40 items-center justify-center text-[color:var(--color-muted)]">
          <User className="h-12 w-12 opacity-50" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
        <span className="truncate text-sm font-medium">{label}</span>
        {micOff ? <MicOff className="h-4 w-4 text-[color:var(--color-danger)]" /> : null}
      </div>
    </div>
  );
}
