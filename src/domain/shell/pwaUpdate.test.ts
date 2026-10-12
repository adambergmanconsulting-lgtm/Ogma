import { describe, expect, it } from 'vitest';
import { shouldOfferUpdateBanner } from './pwaUpdate';

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
