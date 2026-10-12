/**
 * PWA script/resource freshness. Pure rules for when to offer applying a waiting SW.
 * UI wires virtual:pwa-register; reload is user-initiated (Reload for update).
 */

/** How often a long-lived tab should re-check for a new service worker. */
export const PWA_UPDATE_CHECK_MS = 60 * 60 * 1000;

/**
 * Offer Reload when a waiting worker exists and the one-shot vault-key
 * reveal is not on screen (Moment outranks the strip).
 */
export function shouldOfferUpdateBanner(opts: {
  needRefresh: boolean;
  vaultReveal: boolean;
}): boolean {
  return opts.needRefresh && !opts.vaultReveal;
}
