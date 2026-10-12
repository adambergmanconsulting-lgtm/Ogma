import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { PWA_UPDATE_CHECK_MS, shouldOfferUpdateBanner } from '../domain/shell/pwaUpdate';

/**
 * Detects a waiting service worker. Reload is user-initiated via the banner.
 * Offer is hidden during vault-key reveal.
 */
export function usePwaUpdate(opts: { vaultReveal: boolean }) {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration ?? null;
    },
  });

  useEffect(() => {
    const tick = () => {
      void registrationRef.current?.update();
    };
    const id = window.setInterval(tick, PWA_UPDATE_CHECK_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
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
