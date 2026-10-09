/** Whether a stream has no usable audio input (missing, ended, disabled, or muted). */
export function isAudioInputOff(stream: MediaStream | null): boolean {
  if (!stream) return true;
  const live = stream.getAudioTracks().filter((t) => t.readyState === 'live');
  if (live.length === 0) return true;
  return live.every((t) => !t.enabled || t.muted);
}
