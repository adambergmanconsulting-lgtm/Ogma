/** Shared Web Audio unlock so alerts can play after a user gesture. */

type AudioContextCtor = typeof AudioContext;

let sharedCtx: AudioContext | null = null;
let gestureBound = false;

/** Test-only: drop the cached context so stubs can re-bind. */
export function resetSharedAudioContextForTests(): void {
  if (sharedCtx && sharedCtx.state !== 'closed') {
    void sharedCtx.close().catch(() => undefined);
  }
  sharedCtx = null;
}

function getCtor(): AudioContextCtor | undefined {
  return (
    globalThis.AudioContext ||
    (globalThis as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
  );
}

export function getSharedAudioContext(): AudioContext | null {
  const Ctor = getCtor();
  if (!Ctor) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    try {
      sharedCtx = new Ctor();
    } catch {
      return null;
    }
  }
  return sharedCtx;
}

/** Resume the shared context (call from click / key handlers). */
export async function unlockAudioFromGesture(): Promise<void> {
  const ctx = getSharedAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
  } catch {
    // ignore
  }
}

type GestureTarget = {
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ) => void;
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: EventListenerOptions | boolean,
  ) => void;
};

/** Bind once: first pointer/key unlocks audio for message + call alerts. */
export function installAudioUnlockOnGesture(
  target: GestureTarget = globalThis as unknown as GestureTarget,
): () => void {
  if (gestureBound || typeof target.addEventListener !== 'function') return () => {};
  gestureBound = true;

  const unlock = () => {
    void unlockAudioFromGesture();
  };

  target.addEventListener('pointerdown', unlock, { passive: true });
  target.addEventListener('keydown', unlock, { passive: true });

  return () => {
    target.removeEventListener('pointerdown', unlock);
    target.removeEventListener('keydown', unlock);
    gestureBound = false;
  };
}
