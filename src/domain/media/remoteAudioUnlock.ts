/** Chrome blocks unmuted autoplay until a user gesture (PiP click counts). */

const players = new Set<HTMLMediaElement>();
const listeners = new Set<() => void>();
let unlocked = false;

export function isRemoteAudioUnlocked(): boolean {
  return unlocked;
}

export function onRemoteAudioUnlocked(listener: () => void): () => void {
  listeners.add(listener);
  if (unlocked) listener();
  return () => {
    listeners.delete(listener);
  };
}

export function registerRemotePlayer(el: HTMLMediaElement): () => void {
  players.add(el);
  if (unlocked) {
    el.muted = false;
    void el.play().catch(() => undefined);
  }
  return () => {
    players.delete(el);
  };
}

export async function unlockRemoteAudio(): Promise<void> {
  if (unlocked) {
    await Promise.all(
      [...players].map(async (el) => {
        el.muted = false;
        try {
          await el.play();
        } catch {
          // ignore
        }
      }),
    );
    return;
  }
  unlocked = true;
  await Promise.all(
    [...players].map(async (el) => {
      el.muted = false;
      try {
        await el.play();
      } catch {
        // ignore
      }
    }),
  );
  listeners.forEach((fn) => fn());
}
