import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { PWA_UPDATE_CHECK_MS, shouldApplyUpdate } from '../domain/shell/pwaUpdate';

/**
 * Detects a waiting service worker and reloads when safe (not in a call).
 * Mid-call updates stay pending until leave.
 */
export function usePwaUpdate(opts: { inCall: boolean }) {
  const appliedRef = useRef(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const tick = () => {
        void registration.update();
      };
      window.setInterval(tick, PWA_UPDATE_CHECK_MS);
    },
  });

  useEffect(() => {
    if (appliedRef.current) return;
    if (!shouldApplyUpdate({ needRefresh, inCall: opts.inCall })) return;
    appliedRef.current = true;
    void updateServiceWorker(true);
  }, [needRefresh, opts.inCall, updateServiceWorker]);
}
