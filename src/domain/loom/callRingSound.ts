/**
 * Looping ringtone while Accept / Not now is offered.
 * Web Audio only (no asset); stop on dismiss / Accept / call-end.
 */

type Stopper = () => void;

let activeStop: Stopper | null = null;

function getAudioContextConstructor(): typeof AudioContext | undefined {
  return (
    globalThis.AudioContext ||
    (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

/** Two short tones (classic ring burst), then silence until the next loop. */
function scheduleBurst(ctx: AudioContext, at: number): void {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, at);
  master.gain.exponentialRampToValueAtTime(0.12, at + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, at + 0.95);
  master.connect(ctx.destination);

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
  const Ctx = getAudioContextConstructor();
  if (!Ctx) return;

  try {
    const ctx = new Ctx();
    void ctx.resume();

    const periodSec = 2.8;
    let cancelled = false;

    const tick = () => {
      if (cancelled || ctx.state === 'closed') return;
      scheduleBurst(ctx, ctx.currentTime + 0.02);
    };

    tick();
    const id = globalThis.setInterval(tick, periodSec * 1000);

    activeStop = () => {
      cancelled = true;
      globalThis.clearInterval(id);
      activeStop = null;
      void ctx.close().catch(() => undefined);
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
