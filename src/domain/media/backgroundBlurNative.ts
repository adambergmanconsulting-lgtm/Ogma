type BlurCaps = { backgroundBlur?: boolean[] };
type BlurSettings = { backgroundBlur?: boolean };

/** True when the OS camera stack lets the page toggle background blur. */
export function canControlNativeBackgroundBlur(track: MediaStreamTrack): boolean {
  if (track.kind !== 'video' || typeof track.getCapabilities !== 'function') return false;
  const caps = track.getCapabilities() as BlurCaps;
  return Array.isArray(caps.backgroundBlur) && caps.backgroundBlur.length === 2;
}

export function nativeBackgroundBlurEnabled(track: MediaStreamTrack): boolean {
  if (typeof track.getSettings !== 'function') return false;
  return Boolean((track.getSettings() as BlurSettings).backgroundBlur);
}

/** Apply OS background blur when controllable. Returns whether the setting stuck. */
export async function setNativeBackgroundBlur(
  track: MediaStreamTrack,
  enabled: boolean,
): Promise<boolean> {
  if (!canControlNativeBackgroundBlur(track)) return false;
  try {
    await track.applyConstraints({ backgroundBlur: enabled } as MediaTrackConstraints);
    return nativeBackgroundBlurEnabled(track) === enabled;
  } catch {
    return false;
  }
}
