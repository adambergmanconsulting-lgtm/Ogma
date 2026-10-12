import { describe, expect, it, vi } from 'vitest';
import {
  probeServiceWorkerUpdate,
  shouldAttemptPwaUpdateCheck,
  shouldOfferUpdateBanner,
} from './pwaUpdate';

describe('shouldOfferUpdateBanner', () => {
  it('false when no refresh needed', () => {
    expect(shouldOfferUpdateBanner({ needRefresh: false, vaultReveal: false })).toBe(false);
    expect(shouldOfferUpdateBanner({ needRefresh: false, vaultReveal: true })).toBe(false);
  });

  it('holds during vault-key reveal', () => {
    expect(shouldOfferUpdateBanner({ needRefresh: true, vaultReveal: true })).toBe(false);
  });

  it('offers when refresh needed outside reveal', () => {
    expect(shouldOfferUpdateBanner({ needRefresh: true, vaultReveal: false })).toBe(true);
  });
});

describe('shouldAttemptPwaUpdateCheck', () => {
  it('skips offline and in-flight install', () => {
    expect(shouldAttemptPwaUpdateCheck({ online: false, installing: false })).toBe(false);
    expect(shouldAttemptPwaUpdateCheck({ online: true, installing: true })).toBe(false);
    expect(shouldAttemptPwaUpdateCheck({ online: true, installing: false })).toBe(true);
  });
});

describe('probeServiceWorkerUpdate', () => {
  it('no-ops when offline or installing', async () => {
    const update = vi.fn();
    const fetchFn = vi.fn();
    await probeServiceWorkerUpdate({
      swUrl: '/sw.js',
      registration: { installing: {}, update },
      online: true,
      fetchFn,
    });
    await probeServiceWorkerUpdate({
      swUrl: '/sw.js',
      registration: { installing: null, update },
      online: false,
      fetchFn,
    });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('fetches sw.js with no-store then calls update on 200', async () => {
    const update = vi.fn(async () => undefined);
    const fetchFn = vi.fn(async () => ({ status: 200 }));
    await probeServiceWorkerUpdate({
      swUrl: '/Ogma/sw.js',
      registration: { installing: null, update },
      online: true,
      fetchFn,
    });
    expect(fetchFn).toHaveBeenCalledWith('/Ogma/sw.js', {
      cache: 'no-store',
      headers: {
        cache: 'no-store',
        'cache-control': 'no-cache',
      },
    });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('skips update when sw.js fetch is not ok', async () => {
    const update = vi.fn();
    await probeServiceWorkerUpdate({
      swUrl: '/sw.js',
      registration: { installing: null, update },
      online: true,
      fetchFn: async () => ({ status: 404 }),
    });
    expect(update).not.toHaveBeenCalled();
  });
});
