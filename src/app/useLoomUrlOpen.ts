import { useEffect, useRef } from 'react';
import { parseSpaceSecretFromLocation } from '../domain/signaling/room';

/**
 * Cold open from `#space=` once unlocked, plus later hash changes to another space.
 */
export function useLoomUrlOpen(opts: {
  vault: unknown;
  unlocked: boolean;
  focusedSecret: string | null;
  refreshSpaces: () => Promise<void>;
  openSpaceWithSecret: (secret: string) => Promise<string | null>;
  resumeLastSpace: () => Promise<string | null>;
  readyStore: () => Promise<void>;
}) {
  const bootstrapDoneRef = useRef(false);
  const focusedSecretRef = useRef<string | null>(null);
  focusedSecretRef.current = opts.focusedSecret;

  useEffect(() => {
    if (!opts.vault || !opts.unlocked) {
      bootstrapDoneRef.current = false;
      return;
    }
    if (bootstrapDoneRef.current) return;
    bootstrapDoneRef.current = true;
    void (async () => {
      await opts.readyStore();
      await opts.refreshSpaces();
      const fromUrl = parseSpaceSecretFromLocation();
      if (fromUrl) {
        await opts.openSpaceWithSecret(fromUrl);
        return;
      }
      await opts.resumeLastSpace();
    })();
  }, [
    opts.vault,
    opts.unlocked,
    opts.refreshSpaces,
    opts.openSpaceWithSecret,
    opts.resumeLastSpace,
    opts.readyStore,
  ]);

  useEffect(() => {
    if (!opts.unlocked) return;
    const openFromHash = () => {
      const fromUrl = parseSpaceSecretFromLocation();
      if (!fromUrl || fromUrl === focusedSecretRef.current) return;
      void opts.openSpaceWithSecret(fromUrl);
    };
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [opts.unlocked, opts.openSpaceWithSecret]);
}
