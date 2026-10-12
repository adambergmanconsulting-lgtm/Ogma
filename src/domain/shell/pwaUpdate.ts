/**
 * PWA script/resource freshness. Pure rules for when to offer applying a waiting SW
 * and how to re-check for one (bypass CDN cache of sw.js on static hosts).
 * UI wires virtual:pwa-register; reload is user-initiated (Reload for update).
 */

/** How often a long-lived tab should re-check for a new service worker. */
export const PWA_UPDATE_CHECK_MS = 5 * 60 * 1000;

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

/** Skip SW update probes while offline or while an install is already in flight. */
export function shouldAttemptPwaUpdateCheck(opts: {
  online: boolean;
  installing: boolean;
}): boolean {
  return opts.online && !opts.installing;
}

type FetchLike = (
  input: string,
  init?: { cache?: RequestCache; headers?: Record<string, string> },
) => Promise<{ status: number }>;

/**
 * Revalidate sw.js with no-store (GitHub Pages CDN otherwise keeps the old worker),
 * then ask the registration to update so a waiting worker can surface needRefresh.
 */
export async function probeServiceWorkerUpdate(opts: {
  swUrl: string;
  registration: { installing: unknown; update: () => Promise<unknown> };
  online: boolean;
  fetchFn: FetchLike;
}): Promise<void> {
  if (
    !shouldAttemptPwaUpdateCheck({
      online: opts.online,
      installing: Boolean(opts.registration.installing),
    })
  ) {
    return;
  }
  const resp = await opts.fetchFn(opts.swUrl, {
    cache: 'no-store',
    headers: {
      cache: 'no-store',
      'cache-control': 'no-cache',
    },
  });
  if (resp.status === 200) await opts.registration.update();
}
