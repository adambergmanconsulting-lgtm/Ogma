/**
 * Looping ringtone while Accept / Not now is offered.
 * Web Audio only (no asset); stop on dismiss / Accept / call-end.
 */

import { getSharedAudioContext } from '../shell/audioUnlock';

type Stopper = () => void;

let activeStop: Stopper | null = null;

/** Two short tones (classic ring burst), then silence until the next loop. */
function scheduleBurst(ctx: AudioContext, dest: AudioNode, at: number): void {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, at);
  master.gain.exponentialRampToValueAtTime(0.12, at + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, at + 0.95);
  master.connect(dest);

  const tone = (freq: number, start: number, dur: number) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(master);
    osc.start(at + start);
    osc.stop(at + start + dur);
  };

  // Dual-tone ring (approx US cadence: two chirps, pause).
  tone(440, 0, 0.38);
  tone(480, 0, 0.38);
  tone(440, 0.45, 0.38);
  tone(480, 0.45, 0.38);
}

/** Start (or restart) the incoming-call loop. Safe if already playing. */
export function startIncomingCallSound(): void {
  stopIncomingCallSound();
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  try {
    void ctx.resume();

    // Session gain so stop can mute immediately (Safari keeps scheduled oscs otherwise).
    const session = ctx.createGain();
    session.gain.setValueAtTime(1, ctx.currentTime);
    session.connect(ctx.destination);

    const periodSec = 2.8;
    let cancelled = false;

    const tick = () => {
      if (cancelled || ctx.state === 'closed') return;
      scheduleBurst(ctx, session, ctx.currentTime + 0.02);
    };

    tick();
    const id = globalThis.setInterval(tick, periodSec * 1000);

    activeStop = () => {
      cancelled = true;
      globalThis.clearInterval(id);
      try {
        const t = ctx.currentTime;
        session.gain.cancelScheduledValues(t);
        session.gain.setValueAtTime(0, t);
        session.disconnect();
      } catch {
        // already closed / disconnected
      }
      activeStop = null;
    };
  } catch {
    // Autoplay / AudioContext blocked — banner still shows.
  }
}

export function stopIncomingCallSound(): void {
  activeStop?.();
}

/** Test helper: whether a ring loop is armed. */
export function isIncomingCallSoundActive(): boolean {
  return activeStop !== null;
}
