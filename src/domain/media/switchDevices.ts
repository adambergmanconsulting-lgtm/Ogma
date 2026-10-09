import { DEFAULT_MEDIA_CONSTRAINTS } from '../types';
import { replaceTrackOnStream } from './devices';

export async function switchVideoTrack(
  stream: MediaStream,
  deviceId: string,
): Promise<MediaStreamTrack | null> {
  const temp = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: { exact: deviceId },
      width: { max: DEFAULT_MEDIA_CONSTRAINTS.widthMax },
      frameRate: { max: DEFAULT_MEDIA_CONSTRAINTS.frameRateMax },
    },
    audio: false,
  });
  const track = temp.getVideoTracks()[0];
  if (!track) return null;
  replaceTrackOnStream(stream, track);
  return track;
}

export async function switchAudioTrack(
  stream: MediaStream,
  deviceId: string,
  micEnabled: boolean,
): Promise<MediaStreamTrack | null> {
  const temp = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: { exact: deviceId },
      echoCancellation: true,
      noiseSuppression: true,
    },
    video: false,
  });
  const track = temp.getAudioTracks()[0];
  if (!track) return null;
  track.enabled = micEnabled;
  replaceTrackOnStream(stream, track);
  return track;
}
