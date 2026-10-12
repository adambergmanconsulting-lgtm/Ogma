import { beforeEach, describe, expect, it } from 'vitest';
import { ICE_SERVERS } from '../types';
import {
  buildIceServers,
  parseTurnUri,
  readStoredTurnUri,
  TURN_SETTINGS,
  TURN_URI_STORAGE_KEY,
  writeStoredTurnUri,
} from './iceConfig';

function memoryStorage(seed: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(seed));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => {
      map.delete(k);
    },
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

describe('iceConfig', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: memoryStorage(),
    });
  });

  it('keeps Network help copy network-first and honest about unpaid Ogma TURN', () => {
    expect(TURN_SETTINGS.trySteps.length).toBeGreaterThanOrEqual(2);
    expect(TURN_SETTINGS.paidNote).toMatch(/not for sale yet/i);
    expect(TURN_SETTINGS.body).toMatch(/provider you pay/i);
  });

  it('parses turn / turns URIs and rejects others', () => {
    expect(parseTurnUri('turn:example.com:3478')).toEqual({ urls: 'turn:example.com:3478' });
    expect(parseTurnUri('turns:example.com:5349')).toEqual({ urls: 'turns:example.com:5349' });
    expect(parseTurnUri('turn:user:pass@example.com:3478')).toEqual({
      urls: 'turn:example.com:3478',
      username: 'user',
      credential: 'pass',
    });
    expect(parseTurnUri('stun:stun.l.google.com:19302')).toBeNull();
    expect(parseTurnUri('https://example.com')).toBeNull();
    expect(parseTurnUri('')).toBeNull();
  });

  it('builds STUN-only by default and appends stored TURN', () => {
    expect(buildIceServers('')).toEqual(ICE_SERVERS);
    expect(buildIceServers('turn:relay.example:3478')).toEqual([
      ...ICE_SERVERS,
      { urls: 'turn:relay.example:3478' },
    ]);
  });

  it('persists and clears TURN URI', () => {
    const storage = memoryStorage();
    expect(writeStoredTurnUri('not-a-turn', storage)).toEqual({ ok: false, reason: 'invalid' });
    expect(writeStoredTurnUri('turn:relay.example:3478', storage)).toEqual({ ok: true });
    expect(storage.getItem(TURN_URI_STORAGE_KEY)).toBe('turn:relay.example:3478');
    expect(readStoredTurnUri(storage)).toBe('turn:relay.example:3478');
    expect(writeStoredTurnUri('', storage)).toEqual({ ok: true });
    expect(storage.getItem(TURN_URI_STORAGE_KEY)).toBeNull();
  });
});
