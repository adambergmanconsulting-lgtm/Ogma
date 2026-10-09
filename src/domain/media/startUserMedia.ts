import type { MediaConstraintsConfig, MediaDeviceOption } from '../types';
import { DEFAULT_MEDIA_CONSTRAINTS } from '../types';
import {
  applyVideoQualityToTrack,
  buildUserMediaConstraints,
  type SendQualityTier,
} from './constraints';
import { devicesByKind } from './devices';

export async function startUserMediaCapture(options: {
  peerCount: number;
  qualityTier: SendQualityTier;
  congested: boolean;
  videoDeviceId: string;
  audioDeviceId: string;
  config?: Partial<MediaConstraintsConfig>;
}): Promise<MediaStream> {
  const constraints = buildUserMediaConstraints(
    {
      ...DEFAULT_MEDIA_CONSTRAINTS,
      videoDeviceId: options.config?.videoDeviceId || options.videoDeviceId || undefined,
      audioDeviceId: options.config?.audioDeviceId || options.audioDeviceId || undefined,
    },
    options.peerCount,
    { tier: options.qualityTier, congested: options.congested },
  );
  return navigator.mediaDevices.getUserMedia(constraints);
}

export function pickDefaultDeviceIds(
  list: MediaDeviceOption[],
  current: { video: string; audio: string; output: string },
): { video?: string; audio?: string; output?: string } {
  const videos = devicesByKind(list, 'videoinput');
  const audios = devicesByKind(list, 'audioinput');
  const outputs = devicesByKind(list, 'audiooutput');
  return {
    video: !current.video && videos[0] ? videos[0].deviceId : undefined,
    audio: !current.audio && audios[0] ? audios[0].deviceId : undefined,
    output: !current.output && outputs[0] ? outputs[0].deviceId : undefined,
  };
}

export function applyLiveVideoQuality(
  stream: MediaStream,
  peerCount: number,
  qualityTier: SendQualityTier,
  congested: boolean,
  videoDeviceId: string,
  audioDeviceId: string,
): void {
  const constraints = buildUserMediaConstraints(
    {
      ...DEFAULT_MEDIA_CONSTRAINTS,
      videoDeviceId: videoDeviceId || undefined,
      audioDeviceId: audioDeviceId || undefined,
    },
    peerCount,
    { tier: qualityTier, congested },
  );
  for (const track of stream.getVideoTracks()) {
    void applyVideoQualityToTrack(track, constraints);
  }
}
