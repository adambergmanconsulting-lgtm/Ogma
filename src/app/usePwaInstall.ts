import { useEffect, useState } from 'react';
import {
  installOfferMode,
  isFirefoxLike,
  isIosLike,
  isStandaloneDisplay,
  type InstallOfferMode,
} from '../domain/shell/pwaInstall';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/**
 * Captures beforeinstallprompt and reports install offer mode for chrome.
 */
export function usePwaInstall() {
  const [standalone, setStandalone] = useState(() => isStandaloneDisplay());
  const [canPrompt, setCanPrompt] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      setDeferred(ev);
      setCanPrompt(true);
    };
    const onInstalled = () => {
      setStandalone(true);
      setCanPrompt(false);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const mode: InstallOfferMode = installOfferMode({
    standalone,
    canPrompt,
    ios: isIosLike(),
    firefox: isFirefoxLike(),
  });

  const runInstall = async () => {
    if (mode !== 'prompt' || !deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    setCanPrompt(false);
    if (choice.outcome === 'accepted') {
      setStandalone(true);
    }
  };

  return {
    standalone,
    mode,
    runInstall,
  };
}
