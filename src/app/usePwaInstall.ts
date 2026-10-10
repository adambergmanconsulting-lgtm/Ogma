import { useEffect, useState } from 'react';
import {
  INSTALL_DISMISS_KEY,
  installOfferMode,
  isFirefoxLike,
  isIosLike,
  isStandaloneDisplay,
  readDismissed,
  type InstallOfferMode,
  writeDismissed,
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
  const [installDismissed, setInstallDismissed] = useState(() =>
    readDismissed(INSTALL_DISMISS_KEY),
  );
  const [howOpen, setHowOpen] = useState(false);

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
      setHowOpen(false);
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

  const dismissInstall = () => {
    writeDismissed(INSTALL_DISMISS_KEY);
    setInstallDismissed(true);
    setHowOpen(false);
  };

  const runInstall = async () => {
    if (mode === 'prompt' && deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      setCanPrompt(false);
      if (choice.outcome === 'accepted') {
        setStandalone(true);
      } else {
        dismissInstall();
      }
      return;
    }
    setHowOpen(true);
  };

  return {
    standalone,
    mode,
    installDismissed,
    howOpen,
    setHowOpen,
    dismissInstall,
    runInstall,
  };
}
