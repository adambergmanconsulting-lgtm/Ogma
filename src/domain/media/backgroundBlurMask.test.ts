import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyFirstImplPersonAlpha,
  clampMaskEdgeCut,
  DEFAULT_MASK_EDGE_CUT,
  erodeAlphaMask,
  featherAlphaMask,
  FIRST_IMPL_EDGE_CUT_MAX,
  loadMaskEdgeCut,
  maskRefineTuningFromEdgeCut,
  maskRefineTuningFromSearch,
  refinePersonAlpha,
  refinePersonMask,
  saveMaskEdgeCut,
  usesFirstImplMatte,
} from './backgroundBlurMask';

const mem = new Map<string, string>();

beforeEach(() => {
  mem.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    },
  });
});

describe('usesFirstImplMatte', () => {
  it('uses the original matte on Soft / default', () => {
    expect(usesFirstImplMatte(0)).toBe(true);
    expect(usesFirstImplMatte(DEFAULT_MASK_EDGE_CUT)).toBe(true);
    expect(usesFirstImplMatte(FIRST_IMPL_EDGE_CUT_MAX)).toBe(true);
    expect(usesFirstImplMatte(FIRST_IMPL_EDGE_CUT_MAX + 1)).toBe(false);
    expect(usesFirstImplMatte(100)).toBe(false);
  });
});

describe('applyFirstImplPersonAlpha', () => {
  it('writes confidence straight to alpha without shrinking', () => {
    const mask = new Float32Array([0, 0.5, 1, 0.25]);
    const rgba = new Uint8ClampedArray(4 * 4); // 2x2
    applyFirstImplPersonAlpha(mask, 2, 2, 2, 2, rgba);
    expect(rgba[3]).toBe(0);
    expect(rgba[7]).toBe(128);
    expect(rgba[11]).toBe(255);
    expect(rgba[15]).toBe(64);
  });
});

describe('refinePersonAlpha', () => {
  it('kills confidence at or below the floor', () => {
    expect(refinePersonAlpha(0, 0.55, 0.92)).toBe(0);
    expect(refinePersonAlpha(0.55, 0.55, 0.92)).toBe(0);
  });

  it('ramps smoothly between floor and ceil', () => {
    const mid = refinePersonAlpha(0.7, 0.55, 0.92);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(refinePersonAlpha(0.95, 0.55, 0.92)).toBe(1);
  });
});

describe('maskRefineTuningFromEdgeCut', () => {
  it('firms erode as Edge cut rises past Soft', () => {
    const mild = maskRefineTuningFromEdgeCut(FIRST_IMPL_EDGE_CUT_MAX + 1);
    const firm = maskRefineTuningFromEdgeCut(100);
    expect(firm.erodePx).toBeGreaterThanOrEqual(mild.erodePx);
    expect(firm.confidenceFloor).toBeGreaterThanOrEqual(mild.confidenceFloor);
  });
});

describe('maskRefineTuningFromSearch', () => {
  it('overrides knobs from query params', () => {
    const t = maskRefineTuningFromSearch('?maskFloor=0.4&maskErode=0&maskFeather=3');
    expect(t.confidenceFloor).toBe(0.4);
    expect(t.erodePx).toBe(0);
    expect(t.featherPx).toBe(3);
  });
});

describe('mask edge cut persistence', () => {
  it('clamps and round-trips', () => {
    expect(clampMaskEdgeCut(-5)).toBe(0);
    expect(clampMaskEdgeCut(140)).toBe(100);
    expect(loadMaskEdgeCut()).toBe(DEFAULT_MASK_EDGE_CUT);
    saveMaskEdgeCut(55);
    expect(loadMaskEdgeCut()).toBe(55);
  });
});

describe('erodeAlphaMask', () => {
  it('shrinks a solid blob so the edge goes transparent', () => {
    const w = 7;
    const h = 7;
    const alpha = new Float32Array(w * h);
    for (let y = 2; y <= 4; y++) {
      for (let x = 2; x <= 4; x++) {
        alpha[y * w + x] = 1;
      }
    }
    erodeAlphaMask(alpha, w, h, 1);
    expect(alpha[2 * w + 2]).toBe(0);
    expect(alpha[3 * w + 3]).toBe(1);
  });
});

describe('featherAlphaMask', () => {
  it('softens a hard step edge', () => {
    const w = 8;
    const h = 1;
    const alpha = new Float32Array(w);
    for (let x = 0; x < 4; x++) alpha[x] = 0;
    for (let x = 4; x < 8; x++) alpha[x] = 1;
    featherAlphaMask(alpha, w, h, 1);
    expect(alpha[3]!).toBeGreaterThan(0);
    expect(alpha[3]!).toBeLessThan(1);
  });
});

describe('refinePersonMask', () => {
  it('drops a mid-confidence sofa-like patch at Firm edge cut', () => {
    const maskW = 32;
    const maskH = 32;
    const mask = new Float32Array(maskW * maskH);
    for (let y = 6; y <= 25; y++) {
      for (let x = 6; x <= 20; x++) {
        mask[y * maskW + x] = 0.95;
      }
    }
    for (let y = 10; y <= 20; y++) {
      mask[y * maskW + 24] = 0.5;
      mask[y * maskW + 25] = 0.48;
    }

    const out = refinePersonMask(
      mask,
      maskW,
      maskH,
      maskW,
      maskH,
      undefined,
      undefined,
      maskRefineTuningFromEdgeCut(100),
    );
    expect(out[15 * maskW + 24]!).toBeLessThan(0.15);
    expect(out[15 * maskW + 13]!).toBeGreaterThan(0.5);
  });
});
