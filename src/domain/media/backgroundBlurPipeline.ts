import {
  DEFAULT_PRIVACY_BACKDROP,
  parsePrivacyBackdropId,
  privacyBackdropColors,
  type PrivacyBackdropId,
} from './backgroundBlurBackdrop';
import {
  applyFirstImplPersonAlpha,
  clampMaskEdgeCut,
  DEFAULT_MASK_EDGE_CUT,
  refinePersonMask,
  resolveMaskRefineTuning,
  usesFirstImplMatte,
} from './backgroundBlurMask';
import { loadSelfieSegmenter } from './backgroundBlurSegmenter';

export type BackgroundBlurPipeline = {
  outputTrack: MediaStreamTrack;
  setSourceTrack: (track: MediaStreamTrack) => void;
  setFps: (fps: number) => void;
  setBlurRadius: (px: number) => void;
  setWashOpacity: (opacity: number) => void;
  setBackdrop: (id: PrivacyBackdropId) => void;
  setEdgeCut: (value: number) => void;
  stop: () => void;
};

type PipelineOptions = {
  fps?: number;
  blurPx?: number;
  /** Blurred camera wash over the soft fill (0–1). */
  washOpacity?: number;
  backdropId?: PrivacyBackdropId;
  edgeCut?: number;
};

/**
 * Camera track → soft fill + strong person-masked blur → captureStream track.
 * Peers see this via replaceTrack; not preview-only CSS.
 */
export async function createBackgroundBlurPipeline(
  sourceTrack: MediaStreamTrack,
  options: PipelineOptions = {},
): Promise<BackgroundBlurPipeline> {
  const segmenter = await loadSelfieSegmenter();
  let fps = Math.max(8, options.fps ?? 24);
  let blurPx = Math.max(4, options.blurPx ?? 28);
  let washOpacity = Math.max(0, Math.min(1, options.washOpacity ?? 0.38));
  let backdropId = parsePrivacyBackdropId(options.backdropId ?? DEFAULT_PRIVACY_BACKDROP);
  let edgeCut = clampMaskEdgeCut(options.edgeCut ?? DEFAULT_MASK_EDGE_CUT);
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

  let alphaBuf = new Float32Array(0);
  let scratchBuf = new Float32Array(0);

  const resize = () => {
    const w = video.videoWidth || sourceTrack.getSettings().width || 640;
    const h = video.videoHeight || sourceTrack.getSettings().height || 360;
    if (outCanvas.width === w && outCanvas.height === h) return;
    outCanvas.width = w;
    outCanvas.height = h;
    // Half-res blur is cheaper at privacy-strength radii and still reads soft.
    blurCanvas.width = Math.max(2, Math.floor(w / 2));
    blurCanvas.height = Math.max(2, Math.floor(h / 2));
    personCanvas.width = w;
    personCanvas.height = h;
    const n = w * h;
    if (alphaBuf.length !== n) {
      alphaBuf = new Float32Array(n);
      scratchBuf = new Float32Array(n);
    }
  };

  const paint = (maskData: Float32Array | Uint8Array, maskW: number, maskH: number) => {
    resize();
    const w = outCanvas.width;
    const h = outCanvas.height;
    if (w < 2 || h < 2) return;

    const fill = privacyBackdropColors(backdropId);
    const grad = outCtx.createLinearGradient(0, 0, w * 0.12, h);
    grad.addColorStop(0, fill.top);
    grad.addColorStop(0.55, fill.mid);
    grad.addColorStop(1, fill.bottom);
    outCtx.fillStyle = grad;
    outCtx.fillRect(0, 0, w, h);

    const bw = blurCanvas.width;
    const bh = blurCanvas.height;
    blurCtx.filter = `blur(${Math.max(2, Math.round(blurPx / 2))}px)`;
    blurCtx.drawImage(video, 0, 0, bw, bh);
    blurCtx.filter = 'none';
    outCtx.globalAlpha = washOpacity;
    outCtx.drawImage(blurCanvas, 0, 0, w, h);
    outCtx.globalAlpha = 1;

    personCtx.drawImage(video, 0, 0, w, h);
    const person = personCtx.getImageData(0, 0, w, h);
    const px = person.data;
    if (usesFirstImplMatte(edgeCut)) {
      // First implementation: confidence → alpha, no threshold/erode/feather.
      applyFirstImplPersonAlpha(maskData, maskW, maskH, w, h, px);
    } else {
      const tuning = resolveMaskRefineTuning(
        edgeCut,
        typeof window !== 'undefined' ? window.location.search : '',
      );
      const matte = refinePersonMask(
        maskData,
        maskW,
        maskH,
        w,
        h,
        alphaBuf,
        scratchBuf,
        tuning,
      );
      for (let i = 0; i < w * h; i++) {
        px[i * 4 + 3] = Math.round(Math.max(0, Math.min(1, matte[i] ?? 0)) * 255);
      }
    }
    personCtx.putImageData(person, 0, 0);

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
    setWashOpacity(opacity) {
      washOpacity = Math.max(0, Math.min(1, opacity));
    },
    setBackdrop(id) {
      backdropId = parsePrivacyBackdropId(id);
    },
    setEdgeCut(value) {
      edgeCut = clampMaskEdgeCut(value);
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
