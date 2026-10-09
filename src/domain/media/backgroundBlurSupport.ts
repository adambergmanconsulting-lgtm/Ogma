/** Cheap feature detect for the software blur pipeline (no model download). */
export function isSoftwareBackgroundBlurSupported(): boolean {
  if (typeof document === 'undefined') return false;
  if (typeof HTMLCanvasElement === 'undefined') return false;
  if (typeof WebAssembly === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    if (typeof canvas.captureStream !== 'function') return false;
    const gl =
      canvas.getContext('webgl2', { powerPreference: 'low-power' }) ||
      canvas.getContext('webgl', { powerPreference: 'low-power' });
    if (!gl) return false;
    const lose = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}
