/**
 * PWA script/resource freshness. Pure rules for when to apply a waiting SW update.
 * UI wires virtual:pwa-register; this module owns apply-when-safe (never mid-call).
 */

/** How often a long-lived tab should re-check for a new service worker. */
export const PWA_UPDATE_CHECK_MS = 60 * 60 * 1000;

export function shouldApplyUpdate(opts: { needRefresh: boolean; inCall: boolean }): boolean {
  return opts.needRefresh && !opts.inCall;
}
