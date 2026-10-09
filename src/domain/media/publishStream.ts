/**
 * Build the stream peers/UI see. When videoOverride is set, keep the camera
 * track alive as the blur source (do not stop it).
 */
export function buildPublishStream(
  cameraStream: MediaStream,
  videoOverride: MediaStreamTrack | null,
): MediaStream {
  if (!videoOverride) return cameraStream;
  const audio = cameraStream.getAudioTracks();
  return new MediaStream([videoOverride, ...audio]);
}

/** Enable/disable every video track on camera + published streams. */
export function setVideoTracksEnabled(
  streams: Array<MediaStream | null | undefined>,
  enabled: boolean,
): void {
  for (const stream of streams) {
    stream?.getVideoTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }
}

export function setAudioTracksEnabled(stream: MediaStream | null | undefined, enabled: boolean): void {
  stream?.getAudioTracks().forEach((t) => {
    t.enabled = enabled;
  });
}
