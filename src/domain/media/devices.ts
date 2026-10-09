import type { MediaDeviceOption } from '../types';

export async function listMediaDevices(): Promise<MediaDeviceOption[]> {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return [];
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter(
      (d): d is MediaDeviceInfo & { kind: MediaDeviceOption['kind'] } =>
        d.kind === 'audioinput' || d.kind === 'videoinput' || d.kind === 'audiooutput',
    )
    .map((d, index) => ({
      deviceId: d.deviceId,
      kind: d.kind,
      label:
        d.label ||
        `${d.kind === 'audioinput' ? 'Microphone' : d.kind === 'videoinput' ? 'Camera' : 'Speaker'} ${index + 1}`,
    }));
}

export function devicesByKind(
  devices: MediaDeviceOption[],
  kind: MediaDeviceOption['kind'],
): MediaDeviceOption[] {
  return devices.filter((d) => d.kind === kind);
}

/** Replace a track kind on an existing stream; stops the previous track. */
export function replaceTrackOnStream(
  stream: MediaStream,
  nextTrack: MediaStreamTrack,
): MediaStreamTrack | null {
  const kind = nextTrack.kind;
  const previous = stream.getTracks().find((t) => t.kind === kind) ?? null;
  if (previous) {
    stream.removeTrack(previous);
    previous.stop();
  }
  stream.addTrack(nextTrack);
  return previous;
}

export async function setAudioOutput(
  element: HTMLMediaElement,
  deviceId: string,
): Promise<void> {
  const media = element as HTMLMediaElement & {
    setSinkId?: (id: string) => Promise<void>;
  };
  if (typeof media.setSinkId === 'function') {
    await media.setSinkId(deviceId);
  }
}
