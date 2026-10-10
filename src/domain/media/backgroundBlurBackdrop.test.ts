import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_PRIVACY_BACKDROP,
  loadPrivacyBackdropId,
  parsePrivacyBackdropId,
  privacyBackdropColors,
  PRIVACY_BACKDROPS,
  savePrivacyBackdropId,
} from './backgroundBlurBackdrop';

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

describe('parsePrivacyBackdropId', () => {
  it('accepts soft, cool, warm and defaults otherwise', () => {
    expect(parsePrivacyBackdropId('soft')).toBe('soft');
    expect(parsePrivacyBackdropId('cool')).toBe('cool');
    expect(parsePrivacyBackdropId('warm')).toBe('warm');
    expect(parsePrivacyBackdropId('neon')).toBe(DEFAULT_PRIVACY_BACKDROP);
    expect(parsePrivacyBackdropId(null)).toBe(DEFAULT_PRIVACY_BACKDROP);
  });
});

describe('privacyBackdropColors', () => {
  it('maps each built-in id to distinct fills', () => {
    const soft = privacyBackdropColors('soft');
    const cool = privacyBackdropColors('cool');
    const warm = privacyBackdropColors('warm');
    expect(soft.bottom).not.toBe(cool.bottom);
    expect(soft.bottom).not.toBe(warm.bottom);
    expect(PRIVACY_BACKDROPS.map((b) => b.id)).toEqual(['soft', 'cool', 'warm']);
  });
});

describe('privacy backdrop persistence', () => {
  it('loads default then round-trips a choice', () => {
    expect(loadPrivacyBackdropId()).toBe(DEFAULT_PRIVACY_BACKDROP);
    savePrivacyBackdropId('warm');
    expect(loadPrivacyBackdropId()).toBe('warm');
  });
});
