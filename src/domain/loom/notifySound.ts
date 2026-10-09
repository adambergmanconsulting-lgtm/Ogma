/** Short local beep when a warm space gets mail (opt-in). */
export function playNewMessageSound(): void {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.value = 0.05;
    o.frequency.value = 880;
    o.start();
    o.stop(ctx.currentTime + 0.08);
  } catch {
    // ignore autoplay / AudioContext failures
  }
}
