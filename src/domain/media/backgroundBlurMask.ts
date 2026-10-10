/** Person-matte helpers for privacy blur. */

/**
 * **Edge cut** 0–100 (Devices, while blur on):
 * - Soft (≤ {@link FIRST_IMPL_EDGE_CUT_MAX}): original matte — confidence → alpha as-is.
 * - Firm: threshold + erode + feather (hides sofa leaks; can clip hair/face).
 * Optional URL override: `?maskFloor=&maskErode=&maskFeather=&maskCeil=`
 */

const STORAGE_KEY = 'ogma.maskEdgeCut';

/** Soft default — first-impl matte (best face keep). */
export const DEFAULT_MASK_EDGE_CUT = 15;
/** At or below this, paint uses the original nearest-neighbor confidence matte. */
export const FIRST_IMPL_EDGE_CUT_MAX = 25;

/** Confidence floor used when Firm refine is active. */
export const MASK_CONFIDENCE_FLOOR = 0.55;
/** Upper end of the smoothstep ramp after the floor. */
export const MASK_CONFIDENCE_CEIL = 0.92;
/** Morphological shrink at full Firm. */
export const MASK_ERODE_PX = 2;
/** Soft box blur on alpha after erode. */
export const MASK_FEATHER_PX = 2;

export function usesFirstImplMatte(edgeCut: number): boolean {
  return clampMaskEdgeCut(edgeCut) <= FIRST_IMPL_EDGE_CUT_MAX;
}

export type MaskRefineTuning = {
  confidenceFloor: number;
  confidenceCeil: number;
  erodePx: number;
  featherPx: number;
};

export function clampMaskEdgeCut(raw: unknown): number {
  if (raw == null || raw === '') return DEFAULT_MASK_EDGE_CUT;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_MASK_EDGE_CUT;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function loadMaskEdgeCut(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === '') return DEFAULT_MASK_EDGE_CUT;
    return clampMaskEdgeCut(raw);
  } catch {
    return DEFAULT_MASK_EDGE_CUT;
  }
}

export function saveMaskEdgeCut(value: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(clampMaskEdgeCut(value)));
  } catch {
    // Quota / private mode — preference is best-effort.
  }
}

/**
 * Map Edge cut → refine knobs. Only used when {@link usesFirstImplMatte} is false.
 * Remaps (FIRST_IMPL_EDGE_CUT_MAX…100) → (0…1) firmness.
 */
export function maskRefineTuningFromEdgeCut(edgeCut: number): MaskRefineTuning {
  const cut = clampMaskEdgeCut(edgeCut);
  const span = 100 - FIRST_IMPL_EDGE_CUT_MAX;
  const s = span <= 0 ? 1 : Math.max(0, Math.min(1, (cut - FIRST_IMPL_EDGE_CUT_MAX) / span));
  return {
    confidenceFloor: 0.4 + s * 0.2,
    confidenceCeil: 0.85 + s * 0.1,
    erodePx: Math.round(1 + s * 2),
    featherPx: 2,
  };
}

export function defaultMaskRefineTuning(): MaskRefineTuning {
  return maskRefineTuningFromEdgeCut(100);
}

/** Original matte: nearest-neighbor confidence → alpha (0–1), no shrink/feather. */
export function applyFirstImplPersonAlpha(
  maskData: Float32Array | Uint8Array,
  maskW: number,
  maskH: number,
  outW: number,
  outH: number,
  destRgba: Uint8ClampedArray,
): void {
  const scaleX = maskW / outW;
  const scaleY = maskH / outH;
  for (let y = 0; y < outH; y++) {
    const my = Math.min(maskH - 1, Math.floor(y * scaleY));
    for (let x = 0; x < outW; x++) {
      const mx = Math.min(maskW - 1, Math.floor(x * scaleX));
      const conf = maskData[my * maskW + mx] ?? 0;
      const alpha = typeof conf === 'number' && conf <= 1 ? conf : Number(conf) / 255;
      destRgba[(y * outW + x) * 4 + 3] = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
    }
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function parseNum(raw: string | null, fallback: number): number {
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function searchHasMaskOverride(search: string): boolean {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return (
    q.has('maskFloor') ||
    q.has('maskCeil') ||
    q.has('maskErode') ||
    q.has('maskFeather')
  );
}

/** Resolve tuning from Edge cut; query params override when present (debug). */
export function resolveMaskRefineTuning(edgeCut: number, search = ''): MaskRefineTuning {
  const base = maskRefineTuningFromEdgeCut(edgeCut);
  if (!search || !searchHasMaskOverride(search)) return base;
  return maskRefineTuningFromSearch(search, base);
}

/** Parse `maskFloor` / `maskCeil` / `maskErode` / `maskFeather` from a query string. */
export function maskRefineTuningFromSearch(
  search: string,
  base: MaskRefineTuning = defaultMaskRefineTuning(),
): MaskRefineTuning {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  let floor = clamp01(parseNum(q.get('maskFloor'), base.confidenceFloor));
  let ceil = clamp01(parseNum(q.get('maskCeil'), base.confidenceCeil));
  if (ceil <= floor) ceil = Math.min(1, floor + 0.05);
  return {
    confidenceFloor: floor,
    confidenceCeil: ceil,
    erodePx: Math.max(0, Math.min(8, Math.floor(parseNum(q.get('maskErode'), base.erodePx)))),
    featherPx: Math.max(0, Math.min(8, Math.floor(parseNum(q.get('maskFeather'), base.featherPx)))),
  };
}

export function refinePersonAlpha(
  confidence: number,
  floor: number = MASK_CONFIDENCE_FLOOR,
  ceil: number = MASK_CONFIDENCE_CEIL,
): number {
  const c = Number.isFinite(confidence) ? confidence : 0;
  const norm = c > 1 ? c / 255 : c;
  const lo = floor;
  const hi = ceil > lo ? ceil : lo + 0.05;
  if (norm <= lo) return 0;
  if (norm >= hi) return 1;
  const t = (norm - lo) / (hi - lo);
  // Smoothstep — soft ramp, not a hard binary edge.
  return t * t * (3 - 2 * t);
}

/** Bilinear sample of a confidence mask into frame space, then threshold/smoothstep. */
export function upsampleRefinedAlpha(
  maskData: Float32Array | Uint8Array,
  maskW: number,
  maskH: number,
  outW: number,
  outH: number,
  out: Float32Array = new Float32Array(outW * outH),
  tuning: MaskRefineTuning = defaultMaskRefineTuning(),
): Float32Array {
  if (out.length < outW * outH) {
    throw new Error('alpha buffer too small');
  }
  const xScale = maskW > 1 && outW > 1 ? (maskW - 1) / (outW - 1) : 0;
  const yScale = maskH > 1 && outH > 1 ? (maskH - 1) / (outH - 1) : 0;
  for (let y = 0; y < outH; y++) {
    const fy = y * yScale;
    const y0 = Math.floor(fy);
    const y1 = Math.min(maskH - 1, y0 + 1);
    const ty = fy - y0;
    for (let x = 0; x < outW; x++) {
      const fx = x * xScale;
      const x0 = Math.floor(fx);
      const x1 = Math.min(maskW - 1, x0 + 1);
      const tx = fx - x0;
      const c00 = readConf(maskData, maskW, x0, y0);
      const c10 = readConf(maskData, maskW, x1, y0);
      const c01 = readConf(maskData, maskW, x0, y1);
      const c11 = readConf(maskData, maskW, x1, y1);
      const top = c00 + (c10 - c00) * tx;
      const bot = c01 + (c11 - c01) * tx;
      out[y * outW + x] = refinePersonAlpha(
        top + (bot - top) * ty,
        tuning.confidenceFloor,
        tuning.confidenceCeil,
      );
    }
  }
  return out;
}

function readConf(
  maskData: Float32Array | Uint8Array,
  maskW: number,
  x: number,
  y: number,
): number {
  const raw = maskData[y * maskW + x] ?? 0;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return n > 1 ? n / 255 : n;
}

/**
 * Min-neighborhood erode on alpha (in-place via scratch).
 * Shrinks the person silhouette so mid-confidence protrusions drop out.
 */
export function erodeAlphaMask(
  alpha: Float32Array,
  width: number,
  height: number,
  radiusPx: number = MASK_ERODE_PX,
  scratch: Float32Array = new Float32Array(alpha.length),
): Float32Array {
  const r = Math.max(0, Math.floor(radiusPx));
  if (r === 0 || width < 1 || height < 1) return alpha;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let min = 1;
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) {
          min = 0;
          continue;
        }
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) {
            min = 0;
            continue;
          }
          const v = alpha[yy * width + xx] ?? 0;
          if (v < min) min = v;
        }
      }
      scratch[y * width + x] = min;
    }
  }
  alpha.set(scratch.subarray(0, width * height));
  return alpha;
}

/** Separable box blur on alpha for soft silhouette edges. */
export function featherAlphaMask(
  alpha: Float32Array,
  width: number,
  height: number,
  radiusPx: number = MASK_FEATHER_PX,
  scratch: Float32Array = new Float32Array(alpha.length),
): Float32Array {
  const r = Math.max(0, Math.floor(radiusPx));
  if (r === 0 || width < 1 || height < 1) return alpha;
  const span = r * 2 + 1;

  // Horizontal
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let n = 0;
      for (let dx = -r; dx <= r; dx++) {
        const xx = x + dx;
        if (xx < 0 || xx >= width) continue;
        sum += alpha[row + xx] ?? 0;
        n++;
      }
      scratch[row + x] = n ? sum / n : 0;
    }
  }
  // Vertical
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        sum += scratch[yy * width + x] ?? 0;
        n++;
      }
      alpha[y * width + x] = n ? sum / (n || span) : 0;
    }
  }
  return alpha;
}

/**
 * Full refine: bilinear upsample → threshold/smoothstep → erode → feather.
 * Reuses `alpha` / `scratch` buffers across frames when sized correctly.
 */
export function refinePersonMask(
  maskData: Float32Array | Uint8Array,
  maskW: number,
  maskH: number,
  outW: number,
  outH: number,
  alpha: Float32Array = new Float32Array(outW * outH),
  scratch: Float32Array = new Float32Array(outW * outH),
  tuning: MaskRefineTuning = defaultMaskRefineTuning(),
): Float32Array {
  upsampleRefinedAlpha(maskData, maskW, maskH, outW, outH, alpha, tuning);
  erodeAlphaMask(alpha, outW, outH, tuning.erodePx, scratch);
  featherAlphaMask(alpha, outW, outH, tuning.featherPx, scratch);
  return alpha;
}
