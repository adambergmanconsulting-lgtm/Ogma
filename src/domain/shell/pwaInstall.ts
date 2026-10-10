/**
 * Home-screen / install anchor (PWA). Pure rules + local dismiss flags.
 * UI shells wire beforeinstallprompt; this module owns when to offer and copy keys.
 */

export const INSTALL_DISMISS_KEY = 'ogma.install.dismissed';
export const VAULT_NUDGE_DISMISS_KEY = 'ogma.vaultNudge.dismissed';

export type InstallOfferMode = 'prompt' | 'ios' | 'firefox' | 'manual' | 'none';

export type HomeAnchorKind = 'install' | 'vault' | null;

export function isStandaloneDisplay(
  matchMedia?: (q: string) => { matches: boolean },
  nav?: { standalone?: boolean },
): boolean {
  const mm =
    matchMedia ??
    (typeof globalThis.matchMedia === 'function'
      ? globalThis.matchMedia.bind(globalThis)
      : () => ({ matches: false }));
  const n = nav ?? (typeof navigator !== 'undefined' ? (navigator as { standalone?: boolean }) : {});
  try {
    if (mm('(display-mode: standalone)').matches) return true;
  } catch {
    /* ignore */
  }
  return Boolean(n.standalone);
}

export function isIosLike(ua: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''): boolean {
  return /iPad|iPhone|iPod/i.test(ua) || (/\bMacintosh\b/i.test(ua) && /\bMobile\b/i.test(ua));
}

/** Desktop/mobile Firefox (not Chrome/Edge pretending). No Chromium-style install prompt. */
export function isFirefoxLike(
  ua: string = typeof navigator !== 'undefined' ? navigator.userAgent : '',
): boolean {
  return /\bFirefox\b/i.test(ua) && !/\bSeamonkey\b/i.test(ua);
}

export function installOfferMode(opts: {
  standalone: boolean;
  canPrompt: boolean;
  ios: boolean;
  firefox: boolean;
}): InstallOfferMode {
  if (opts.standalone) return 'none';
  if (opts.canPrompt) return 'prompt';
  if (opts.ios) return 'ios';
  if (opts.firefox) return 'firefox';
  return 'manual';
}

/** Expanded how-to for non-prompt modes (locked with ui-naming). */
export function installHowForMode(mode: InstallOfferMode): string | null {
  switch (mode) {
    case 'ios':
      return INSTALL_MOMENT.iosHow;
    case 'firefox':
      return INSTALL_MOMENT.firefoxHow;
    case 'manual':
      return INSTALL_MOMENT.manualHow;
    default:
      return null;
  }
}

/** After the user has local chats, offer install once (unless dismissed / already installed). */
export function shouldOfferInstallMoment(opts: {
  standalone: boolean;
  dismissed: boolean;
  hasLocalChats: boolean;
}): boolean {
  return opts.hasLocalChats && !opts.standalone && !opts.dismissed;
}

/** After install is settled, quiet vault-key nudge when chats exist and no key. */
export function shouldOfferVaultNudge(opts: {
  hasLocalChats: boolean;
  hasVaultKey: boolean;
  dismissed: boolean;
  installMomentActive: boolean;
}): boolean {
  if (opts.installMomentActive) return false;
  return opts.hasLocalChats && !opts.hasVaultKey && !opts.dismissed;
}

export function pickHomeAnchor(opts: {
  standalone: boolean;
  installDismissed: boolean;
  vaultNudgeDismissed: boolean;
  hasLocalChats: boolean;
  hasVaultKey: boolean;
}): HomeAnchorKind {
  if (
    shouldOfferInstallMoment({
      standalone: opts.standalone,
      dismissed: opts.installDismissed,
      hasLocalChats: opts.hasLocalChats,
    })
  ) {
    return 'install';
  }
  if (
    shouldOfferVaultNudge({
      hasLocalChats: opts.hasLocalChats,
      hasVaultKey: opts.hasVaultKey,
      dismissed: opts.vaultNudgeDismissed,
      installMomentActive: false,
    })
  ) {
    return 'vault';
  }
  return null;
}

export function readDismissed(key: string, storage: Storage | null = safeStorage()): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function writeDismissed(key: string, storage: Storage | null = safeStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(key, '1');
  } catch {
    /* ignore quota */
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

/** Locked microcopy — keep in sync with ui-naming.md. */
export const INSTALL_MOMENT = {
  title: 'Keep Ogma on your home screen',
  body: 'Open Ogma from here next time. Your chats stay in this browser.',
  primaryPrompt: 'Install',
  primaryIos: 'How to add',
  primaryFirefox: 'How to install',
  primaryManual: 'How to install',
  notNow: 'Not now',
  iosHow: 'Share → Add to Home Screen',
  /** Firefox has no Chromium-style install; point at Chrome’s address-bar install. */
  firefoxHow:
    'For a real home-screen app, open this same Ogma link in Chrome, then use the install icon in the address bar.',
  manualHow: 'Use the install icon in the address bar (Chrome or Edge), or your browser’s Install control.',
} as const;

export const VAULT_NUDGE = {
  title: 'Open these chats elsewhere',
  body: 'Add a vault key if you want to lock or move them to another device.',
  primary: 'Add vault key',
  notNow: 'Not now',
} as const;

export const SETTINGS_INSTALL = {
  heading: 'Home screen',
  bodyInstalled: 'Ogma is installed on this device.',
  bodyPrompt: 'Add Ogma to your home screen so you can open it like an app.',
  bodyIos: 'Add Ogma to your home screen: Share → Add to Home Screen.',
  bodyFirefox:
    'Firefox can’t install Ogma the way Chrome can. Open this link in Chrome, then use the install icon in the address bar.',
  bodyManual: 'Add Ogma with the install icon in the address bar (Chrome or Edge).',
  actionPrompt: 'Install Ogma',
  actionHow: 'Show steps',
} as const;
