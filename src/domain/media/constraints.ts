import type { MediaConstraintsConfig } from '../types';
import { DEFAULT_MEDIA_CONSTRAINTS } from '../types';

/** Build getUserMedia constraints with adaptive quality caps for mesh calls. */
export function buildUserMediaConstraints(
  config: Partial<MediaConstraintsConfig> = {},
  peerCount = 1,
): MediaStreamConstraints {
  const widthMax = config.widthMax ?? DEFAULT_MEDIA_CONSTRAINTS.widthMax;
  const frameRateMax = config.frameRateMax ?? DEFAULT_MEDIA_CONSTRAINTS.frameRateMax;

  // Soften capture as mesh grows to limit uplink pressure.
  const scale = peerCount <= 2 ? 1 : peerCount <= 4 ? 0.75 : 0.55;
  const width = Math.round(widthMax * scale);
  const frameRate = Math.max(15, Math.round(frameRateMax * (peerCount <= 2 ? 1 : 0.8)));

  const video: MediaTrackConstraints = {
    width: { ideal: width, max: widthMax },
    height: { ideal: Math.round((width * 9) / 16), max: 720 },
    frameRate: { ideal: frameRate, max: frameRateMax },
  };

  if (config.videoDeviceId) {
    video.deviceId = { exact: config.videoDeviceId };
  }

  // AGC often pumps/clips on desktop (esp. two tabs on one machine). Keep AEC; skip AGC.
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

