import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import {
  PWA_UPDATE_CHECK_MS,
  probeServiceWorkerUpdate,
  shouldOfferUpdateBanner,
} from '../domain/shell/pwaUpdate';

function probeFromRefs(
  swUrlRef: { current: string | null },
  registrationRef: { current: ServiceWorkerRegistration | null },
): void {
  const swUrl = swUrlRef.current;
  const registration = registrationRef.current;
  if (!swUrl || !registration) return;
  void probeServiceWorkerUpdate({
    swUrl,
    registration,
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
    fetchFn: fetch,
  });
}

/**
 * Detects a waiting service worker. Reload is user-initiated via the banner.
 * Offer is hidden during vault-key reveal.
 * Long-lived tabs re-probe sw.js with no-store so GitHub Pages CDN cannot
 * hide deploys until Ctrl+F5.
 */
export function usePwaUpdate(opts: { vaultReveal: boolean }) {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const swUrlRef = useRef<string | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      swUrlRef.current = swUrl;
      registrationRef.current = registration ?? null;
      probeFromRefs(swUrlRef, registrationRef);
    },
  });

  useEffect(() => {
    const tick = () => probeFromRefs(swUrlRef, registrationRef);
    tick();
    const id = window.setInterval(tick, PWA_UPDATE_CHECK_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    const onFocus = () => tick();
    const onOnline = () => tick();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  const updateReady = shouldOfferUpdateBanner({
    needRefresh,
    vaultReveal: opts.vaultReveal,
  });

  return {
    updateReady,
    applyUpdate: () => {
      void updateServiceWorker(true);
    },
  };
}
