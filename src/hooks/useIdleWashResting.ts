import { useEffect, useState } from 'react';

/** Quiet time before the wash fades in after mount or activity. */
export const IDLE_WASH_QUIET_MS = 5000;

/**
 * Arm a one-shot quiet timer. Returns a cancel function, or undefined while `hold`.
 */
export function armIdleWashReady(
  hold: boolean,
  onReady: () => void,
  quietMs: number = IDLE_WASH_QUIET_MS,
): (() => void) | undefined {
  if (hold) return undefined;
  const timer = globalThis.setTimeout(onReady, quietMs);
  return () => globalThis.clearTimeout(timer);
}

/**
 * Fade the idle wash while `hold` is true (e.g. Call), or for
 * `IDLE_WASH_QUIET_MS` after each `tick` change (compose, new message).
 */
export function useIdleWashResting(opts: { hold: boolean; tick: string | number }) {
  const [resting, setResting] = useState(true);

  useEffect(() => {
    setResting(true);
    return armIdleWashReady(opts.hold, () => setResting(false));
  }, [opts.hold, opts.tick]);

  return resting;
}
