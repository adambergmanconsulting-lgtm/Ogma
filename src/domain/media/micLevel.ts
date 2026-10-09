/** Domain mic level from a capture stream — shared by UI meter and speaking broadcast. */

export type MicLevelMonitor = {
  /** Latest RMS-ish level in 0..1 */
  getLevel: () => number;
  stop: () => void;
};

export function createMicLevelMonitor(stream: MediaStream | null): MicLevelMonitor | null {
  if (!stream || typeof AudioContext === 'undefined') return null;
  const tracks = stream.getAudioTracks().filter((t) => t.readyState === 'live' && t.enabled);
  if (!tracks.length) return null;

  let level = 0;
  let raf = 0;
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
    return null;
  }

  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i]! - 128) / 128;
      sum += v * v;
    }
    level = Math.min(1, Math.sqrt(sum / data.length) * 10);
    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    void ctx.resume().finally(() => {
      raf = requestAnimationFrame(tick);
    });
  };
  start();
  const unlock = () => start();
  window.addEventListener('pointerdown', unlock, { once: true });

  return {
    getLevel: () => level,
    stop: () => {
      window.removeEventListener('pointerdown', unlock);
      cancelAnimationFrame(raf);
      try {
        source.disconnect();
      } catch {
        // ignore
      }
      void ctx.close();
    },
  };
}

export const SPEAKING_LEVEL_THRESHOLD = 0.12;

export function isSpeakingLevel(level: number, threshold = SPEAKING_LEVEL_THRESHOLD): boolean {
  return level >= threshold;
}
