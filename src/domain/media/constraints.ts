import type { MediaConstraintsConfig } from '../types';
import { DEFAULT_MEDIA_CONSTRAINTS } from '../types';

export type SendQualityTier = 'high' | 'low';

/** Per-peer / room mesh path quality from video RTP stats. */
export type LinkQuality = 'good' | 'fair' | 'poor';

export type ConstraintQualityOptions = {
  /** Speaking self-tier — silent peers send lower capture. */
  tier?: SendQualityTier;
  /** From WebRTC peer stats — drop below soft ceiling. */
  linkQuality?: LinkQuality;
  /** @deprecated Prefer linkQuality; true maps to fair. */
  congested?: boolean;
};

function resolveLinkQuality(quality: ConstraintQualityOptions): LinkQuality {
  if (quality.linkQuality) return quality.linkQuality;
  return quality.congested ? 'fair' : 'good';
}

/** Soft capture ceilings by N; link quality / tier move quality down from the ceiling. */
export function buildUserMediaConstraints(
  config: Partial<MediaConstraintsConfig> = {},
  peerCount = 1,
  quality: ConstraintQualityOptions = {},
): MediaStreamConstraints {
  const widthMax = config.widthMax ?? DEFAULT_MEDIA_CONSTRAINTS.widthMax;
  const frameRateMax = config.frameRateMax ?? DEFAULT_MEDIA_CONSTRAINTS.frameRateMax;
  const tier = quality.tier ?? 'high';
  const linkQuality = resolveLinkQuality(quality);
  const n = Math.max(1, peerCount);

  let widthIdeal: number;
  let fpsIdeal: number;

  if (n <= 2) {
    widthIdeal = 1280;
    fpsIdeal = 30;
  } else if (n <= 4) {
    widthIdeal = 960;
    fpsIdeal = 30;
  } else {
    widthIdeal = 640;
    fpsIdeal = 20;
  }

  if (linkQuality === 'fair') {
    widthIdeal = Math.min(widthIdeal, n <= 2 ? 640 : n <= 4 ? 640 : 480);
    fpsIdeal = Math.min(fpsIdeal, n <= 2 ? 20 : 15);
  } else if (linkQuality === 'poor') {
    widthIdeal = Math.min(widthIdeal, 360);
    fpsIdeal = Math.min(fpsIdeal, 10);
  }

  if (tier === 'low') {
    widthIdeal = Math.min(widthIdeal, n <= 2 ? 640 : 480);
    fpsIdeal = Math.min(fpsIdeal, 15);
  }

  widthIdeal = Math.min(widthIdeal, widthMax);
  fpsIdeal = Math.min(fpsIdeal, frameRateMax);

  const video: MediaTrackConstraints = {
    width: { ideal: widthIdeal, max: widthMax },
    height: { ideal: Math.round((widthIdeal * 9) / 16), max: 720 },
    frameRate: { ideal: fpsIdeal, max: frameRateMax },
  };

  if (config.videoDeviceId) {
    video.deviceId = { exact: config.videoDeviceId };
  }

  const audio: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: false,
  };

  if (config.audioDeviceId) {
    audio.deviceId = { exact: config.audioDeviceId };
  }

  return { audio, video };
}

/** Apply video ideals from constraints onto a live track when possible. */
export async function applyVideoQualityToTrack(
  track: MediaStreamTrack,
  constraints: MediaStreamConstraints,
): Promise<void> {
  if (track.kind !== 'video' || !constraints.video || typeof constraints.video === 'boolean') {
    return;
  }
  try {
    await track.applyConstraints(constraints.video);
  } catch {
    // Device may reject mid-call; keep prior settings.
  }
}
