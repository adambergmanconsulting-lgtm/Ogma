import { useEffect, useState } from 'react';
import { createMicLevelMonitor } from '../domain/media/micLevel';

type MicLevelProps = {
  stream: MediaStream | null;
  active: boolean;
};

/** Speaking meter on the local video tile — proves mic input from the capture stream. */
export function MicLevel({ stream, active }: MicLevelProps) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!stream || !active) {
      setLevel(0);
      return;
    }
    const monitor = createMicLevelMonitor(stream);
    if (!monitor) {
      setLevel(0);
      return;
    }
    const id = window.setInterval(() => setLevel(monitor.getLevel()), 50);
    return () => {
      window.clearInterval(id);
      monitor.stop();
    };
  }, [active, stream]);

  const pct = active ? Math.max(8, Math.round(level * 100)) : 0;

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
