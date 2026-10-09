import { useEffect, useRef, useState } from 'react';

type MicLevelProps = {
  stream: MediaStream | null;
  active: boolean;
  variant?: 'tile' | 'bar';
};

/** Speaking meter next to mute — proves mic input even when local speaker is muted. */
export function MicLevel({ stream, active, variant = 'tile' }: MicLevelProps) {
  const [level, setLevel] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!stream || !active) {
      setLevel(0);
      return;
    }
    const tracks = stream.getAudioTracks().filter((t) => t.readyState === 'live' && t.enabled);
    if (!tracks.length || typeof AudioContext === 'undefined') {
      setLevel(0);
      return;
    }

    let ctx: AudioContext;
    let source: MediaStreamAudioSourceNode;
    let analyser: AnalyserNode;
    const data = new Uint8Array(512);

    try {
      ctx = new AudioContext();
      source = ctx.createMediaStreamSource(new MediaStream(tracks));
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
    } catch {
      setLevel(0);
      return;
    }

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i]! - 128) / 128;
        sum += v * v;
      }
      setLevel(Math.min(1, Math.sqrt(sum / data.length) * 10));
      raf.current = requestAnimationFrame(tick);
    };

    const start = () => {
      void ctx.resume().finally(() => {
        raf.current = requestAnimationFrame(tick);
      });
    };
    start();
    // Unlock AudioContext if the browser left it suspended.
    const unlock = () => start();
    window.addEventListener('pointerdown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      cancelAnimationFrame(raf.current);
      try {
        source.disconnect();
      } catch {
        // ignore
      }
      void ctx.close();
    };
  }, [active, stream]);

  const pct = active ? Math.max(8, Math.round(level * 100)) : 0;

  if (variant === 'bar') {
    return (
      <div className="flex min-w-[7rem] flex-col gap-0.5 px-1" data-testid="mic-level">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-gold)]">
          {active ? 'Speak — mic level' : 'Mic muted'}
        </span>
        <div className="h-3 w-full overflow-hidden rounded-full bg-black/60 ring-1 ring-white/25">
          <div
            className="h-full rounded-full bg-[color:var(--color-ok)] transition-[width] duration-75"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="mic-level"
      className="h-2.5 w-16 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/20"
    >
      <div
        className="h-full rounded-full bg-[color:var(--color-ok)] transition-[width] duration-75"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
