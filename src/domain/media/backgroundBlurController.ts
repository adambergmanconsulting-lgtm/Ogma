import {
  loadPrivacyBackdropId,
  parsePrivacyBackdropId,
  savePrivacyBackdropId,
  type PrivacyBackdropId,
} from './backgroundBlurBackdrop';
import {
  clampMaskEdgeCut,
  loadMaskEdgeCut,
  saveMaskEdgeCut,
} from './backgroundBlurMask';
import {
  canControlNativeBackgroundBlur,
  setNativeBackgroundBlur,
} from './backgroundBlurNative';
import {
  createBackgroundBlurPipeline,
  type BackgroundBlurPipeline,
} from './backgroundBlurPipeline';
import {
  backgroundBlurRadiusPx,
  backgroundBlurTargetFps,
  backgroundBlurWashOpacity,
  shouldYieldBackgroundBlur,
  type BackgroundBlurPressure,
} from './backgroundBlurPolicy';
import { isSoftwareBackgroundBlurSupported } from './backgroundBlurSupport';
import { buildPublishStream } from './publishStream';

export type BackgroundBlurMode = 'off' | 'native' | 'software';

export type BackgroundBlurController = {
  mode: BackgroundBlurMode;
  enabled: boolean;
  backdropId: PrivacyBackdropId;
  /** Edge cut 0–100 — higher = firmer person matte (real-time). */
  edgeCut: number;
  /** Latest MediaStream for UI + WebRTC (may wrap a processed track). */
  publishStream: MediaStream | null;
  supported: boolean;
  enable: () => Promise<{ ok: boolean; reason?: string }>;
  disable: () => Promise<void>;
  setBackdrop: (id: PrivacyBackdropId) => void;
  setEdgeCut: (value: number) => void;
  /** Call when camera track changes (device switch). */
  onCameraTrackChanged: () => Promise<void>;
  /** Soft-yield under mesh/CPU pressure; returns true if blur was turned off. */
  applyPressure: (pressure: BackgroundBlurPressure) => Promise<boolean>;
  stop: () => void;
};

export function createBackgroundBlurController(options: {
  getCameraStream: () => MediaStream | null;
  onPublishStream: (stream: MediaStream | null) => void;
  onTrackReplaced?: (track: MediaStreamTrack) => void;
}): BackgroundBlurController {
  let mode: BackgroundBlurMode = 'off';
  let enabled = false;
  let backdropId: PrivacyBackdropId = loadPrivacyBackdropId();
  let edgeCut = loadMaskEdgeCut();
  let pipeline: BackgroundBlurPipeline | null = null;
  let publishStream: MediaStream | null = null;
  let pressure: BackgroundBlurPressure = {
    peerCount: 1,
    congested: false,
    qualityTier: 'high',
  };

  const cameraVideo = (): MediaStreamTrack | null =>
    options.getCameraStream()?.getVideoTracks()[0] ?? null;

  const emitPublish = (stream: MediaStream | null, replaced?: MediaStreamTrack) => {
    publishStream = stream;
    options.onPublishStream(stream);
    if (replaced) options.onTrackReplaced?.(replaced);
  };

  const stopSoftware = () => {
    pipeline?.stop();
    pipeline = null;
  };

  const restoreCameraPublish = () => {
    const camera = options.getCameraStream();
    if (!camera) {
      emitPublish(null);
      return;
    }
    emitPublish(camera, cameraVideo() ?? undefined);
  };

  const enable = async (): Promise<{ ok: boolean; reason?: string }> => {
    if (enabled) return { ok: true };
    if (shouldYieldBackgroundBlur(pressure)) {
      return { ok: false, reason: 'Call is under load — blur paused' };
    }
    const camera = options.getCameraStream();
    const track = cameraVideo();
    if (!camera || !track) return { ok: false, reason: 'Camera not ready' };

    if (canControlNativeBackgroundBlur(track)) {
      const ok = await setNativeBackgroundBlur(track, true);
      if (ok) {
        mode = 'native';
        enabled = true;
        emitPublish(camera);
        return { ok: true };
      }
    }

    if (!isSoftwareBackgroundBlurSupported()) {
      return { ok: false, reason: 'Background blur is not supported here' };
    }

    try {
      stopSoftware();
      pipeline = await createBackgroundBlurPipeline(track, {
        fps: backgroundBlurTargetFps(pressure),
        blurPx: backgroundBlurRadiusPx(pressure),
        washOpacity: backgroundBlurWashOpacity(pressure),
        backdropId,
        edgeCut,
      });
      pipeline.outputTrack.enabled = track.enabled;
      mode = 'software';
      enabled = true;
      emitPublish(buildPublishStream(camera, pipeline.outputTrack), pipeline.outputTrack);
      return { ok: true };
    } catch {
      stopSoftware();
      mode = 'off';
      enabled = false;
      return { ok: false, reason: 'Could not start background blur' };
    }
  };

  const disable = async () => {
    if (!enabled && mode === 'off') return;
    const track = cameraVideo();
    if (mode === 'native' && track) {
      await setNativeBackgroundBlur(track, false);
    }
    stopSoftware();
    mode = 'off';
    enabled = false;
    restoreCameraPublish();
  };

  return {
    get mode() {
      return mode;
    },
    get enabled() {
      return enabled;
    },
    get backdropId() {
      return backdropId;
    },
    get edgeCut() {
      return edgeCut;
    },
    get publishStream() {
      return publishStream;
    },
    get supported() {
      const track = cameraVideo();
      if (track && canControlNativeBackgroundBlur(track)) return true;
      return isSoftwareBackgroundBlurSupported();
    },
    enable,
    disable,

    setBackdrop(id) {
      backdropId = parsePrivacyBackdropId(id);
      savePrivacyBackdropId(backdropId);
      pipeline?.setBackdrop(backdropId);
    },

    setEdgeCut(value) {
      edgeCut = clampMaskEdgeCut(value);
      saveMaskEdgeCut(edgeCut);
      pipeline?.setEdgeCut(edgeCut);
    },

    async onCameraTrackChanged() {
      const camera = options.getCameraStream();
      const track = cameraVideo();
      if (!camera || !track) {
        stopSoftware();
        mode = 'off';
        enabled = false;
        emitPublish(null);
        return;
      }
      if (!enabled) {
        emitPublish(camera, track);
        return;
      }
      if (mode === 'native') {
        await setNativeBackgroundBlur(track, true);
        emitPublish(camera, track);
        return;
      }
      if (pipeline) {
        pipeline.setSourceTrack(track);
        pipeline.outputTrack.enabled = track.enabled;
        emitPublish(buildPublishStream(camera, pipeline.outputTrack), pipeline.outputTrack);
        return;
      }
      enabled = false;
      mode = 'off';
      const result = await enable();
      if (!result.ok) restoreCameraPublish();
    },

    async applyPressure(next) {
      pressure = next;
      if (pipeline) {
        pipeline.setFps(backgroundBlurTargetFps(pressure));
        pipeline.setBlurRadius(backgroundBlurRadiusPx(pressure));
        pipeline.setWashOpacity(backgroundBlurWashOpacity(pressure));
      }
      if (enabled && shouldYieldBackgroundBlur(pressure)) {
        await disable();
        return true;
      }
      return false;
    },

    stop() {
      const track = cameraVideo();
      if (mode === 'native' && track) {
        void setNativeBackgroundBlur(track, false);
      }
      stopSoftware();
      mode = 'off';
      enabled = false;
      publishStream = null;
    },
  };
}
