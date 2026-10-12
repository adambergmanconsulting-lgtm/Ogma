import { getSharedAudioContext } from '../shell/audioUnlock';

/** Two-note chime when a warm space gets mail (Settings → Alerts). */
export function playNewMessageSound(): void {
  const ctx = getSharedAudioContext();
  if (!ctx) return;
  try {
    void ctx.resume();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    master.connect(ctx.destination);

    const beep = (freq: number, start: number, dur: number) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(master);
      o.start(now + start);
      o.stop(now + start + dur);
    };

    beep(880, 0, 0.09);
    beep(1320, 0.11, 0.14);
  } catch {
    // ignore autoplay / AudioContext failures
  }
}
