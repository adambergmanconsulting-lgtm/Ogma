import { unlockRemoteAudio } from './remoteAudioUnlock';
import { setAudioOutput } from './devices';

/** Play a short two-note chime on the selected speaker; unlocks remote call audio. */
export async function playTestTone(outputDeviceId?: string): Promise<void> {
  const Ctx =
    globalThis.AudioContext ||
    (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) throw new Error('Audio is not supported in this browser');

  await unlockRemoteAudio();

  const ctx = new Ctx();
  await ctx.resume();

  // Route through an element so setSinkId can target the chosen speaker when supported.
  const dest = ctx.createMediaStreamDestination();
  const el = document.createElement('audio');
  el.srcObject = dest.stream;
  el.setAttribute('playsinline', 'true');
  document.body.appendChild(el);
  if (outputDeviceId) {
    try {
      await setAudioOutput(el, outputDeviceId);
    } catch {
      // fall back to default output
    }
  }
  await el.play();

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  master.connect(dest);

  const beep = (freq: number, start: number, dur: number) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(master);
    osc.start(now + start);
    osc.stop(now + start + dur);
  };

  beep(880, 0, 0.16);
  beep(1175, 0.18, 0.22);

  await new Promise((r) => setTimeout(r, 700));
  el.pause();
  el.srcObject = null;
  el.remove();
  await ctx.close();
}
