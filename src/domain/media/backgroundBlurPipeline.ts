import { loadSelfieSegmenter } from './backgroundBlurSegmenter';

export type BackgroundBlurPipeline = {
  outputTrack: MediaStreamTrack;
  setSourceTrack: (track: MediaStreamTrack) => void;
  setFps: (fps: number) => void;
  setBlurRadius: (px: number) => void;
  stop: () => void;
};

type PipelineOptions = {
  fps?: number;
  blurPx?: number;
};

/**
 * Camera track → person-masked blur → captureStream track.
 * Peers see this via replaceTrack; not preview-only CSS.
 */
export async function createBackgroundBlurPipeline(
  sourceTrack: MediaStreamTrack,
  options: PipelineOptions = {},
): Promise<BackgroundBlurPipeline> {
  const segmenter = await loadSelfieSegmenter();
  let fps = Math.max(8, options.fps ?? 24);
  let blurPx = Math.max(4, options.blurPx ?? 12);
  let running = true;
  let lastTimestamp = -1;
  let frameTimer: number | null = null;

  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', 'true');
  video.srcObject = new MediaStream([sourceTrack]);
  await video.play().catch(() => undefined);

  const outCanvas = document.createElement('canvas');
  const blurCanvas = document.createElement('canvas');
  const personCanvas = document.createElement('canvas');
  const outCtx = outCanvas.getContext('2d', { alpha: false });
  const blurCtx = blurCanvas.getContext('2d', { alpha: false });
  const personCtx = personCanvas.getContext('2d', { willReadFrequently: true });
  if (!outCtx || !blurCtx || !personCtx) {
    throw new Error('Could not create canvas for background blur');
  }

  const capture = outCanvas.captureStream(fps);
  const outputTrack = capture.getVideoTracks()[0];
  if (!outputTrack) throw new Error('captureStream produced no video track');

  const resize = () => {
    const w = video.videoWidth || sourceTrack.getSettings().width || 640;
    const h = video.videoHeight || sourceTrack.getSettings().height || 360;
    if (outCanvas.width === w && outCanvas.height === h) return;
    outCanvas.width = w;
    outCanvas.height = h;
    blurCanvas.width = w;
    blurCanvas.height = h;
    personCanvas.width = w;
    personCanvas.height = h;
  };

  const paint = (maskData: Float32Array | Uint8Array, maskW: number, maskH: number) => {
    resize();
    const w = outCanvas.width;
    const h = outCanvas.height;
    if (w < 2 || h < 2) return;

    blurCtx.filter = `blur(${blurPx}px)`;
    blurCtx.drawImage(video, 0, 0, w, h);
    blurCtx.filter = 'none';

    personCtx.drawImage(video, 0, 0, w, h);
    const person = personCtx.getImageData(0, 0, w, h);
    const px = person.data;
    const scaleX = maskW / w;
    const scaleY = maskH / h;
    for (let y = 0; y < h; y++) {
      const my = Math.min(maskH - 1, Math.floor(y * scaleY));
      for (let x = 0; x < w; x++) {
        const mx = Math.min(maskW - 1, Math.floor(x * scaleX));
        const conf = maskData[my * maskW + mx] ?? 0;
        const alpha = typeof conf === 'number' && conf <= 1 ? conf : Number(conf) / 255;
        px[(y * w + x) * 4 + 3] = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
      }
    }
    personCtx.putImageData(person, 0, 0);

    outCtx.drawImage(blurCanvas, 0, 0);
    outCtx.drawImage(personCanvas, 0, 0);
  };

  const tick = () => {
    if (!running) return;
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const now = performance.now();
      if (now !== lastTimestamp) {
        lastTimestamp = now;
        try {
          const result = segmenter.segmentForVideo(video, now);
          try {
            const mask = result.confidenceMasks?.[0];
            if (mask) {
              paint(mask.getAsFloat32Array(), mask.width, mask.height);
            }
          } finally {
            result.close();
          }
        } catch {
          // Drop a frame on segmenter hiccups; keep pipeline alive.
        }
      }
    }
    frameTimer = window.setTimeout(tick, Math.round(1000 / fps));
  };

  tick();

  return {
    outputTrack,
    setSourceTrack(track) {
      video.srcObject = new MediaStream([track]);
      void video.play().catch(() => undefined);
    },
    setFps(next) {
      fps = Math.max(8, next);
      const capturer = capture as MediaStream & {
        getVideoTracks: () => MediaStreamTrack[];
      };
      const t = capturer.getVideoTracks()[0] as MediaStreamTrack & {
        applyConstraints?: (c: MediaTrackConstraints) => Promise<void>;
      };
      void t.applyConstraints?.({ frameRate: fps }).catch(() => undefined);
    },
    setBlurRadius(px) {
      blurPx = Math.max(4, px);
    },
    stop() {
      running = false;
      if (frameTimer != null) window.clearTimeout(frameTimer);
      frameTimer = null;
      outputTrack.stop();
      video.pause();
      video.srcObject = null;
    },
  };
}
