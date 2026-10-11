/**
 * Home-screen / install anchor (PWA). Pure rules + local dismiss flags.
 * UI shells wire beforeinstallprompt; this module owns when to offer and copy keys.
 */

export const WELCOME_DISMISS_KEY = 'ogma.welcome.dismissed';
/** @deprecated Prefer WELCOME_DISMISS_KEY; kept for older localStorage. */
export const INSTALL_DISMISS_KEY = 'ogma.install.dismissed';
/** @deprecated Prefer WELCOME_DISMISS_KEY; kept for older localStorage. */
export const VAULT_NUDGE_DISMISS_KEY = 'ogma.vaultNudge.dismissed';

export type InstallOfferMode = 'prompt' | 'ios' | 'firefox' | 'manual' | 'none';

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

/** Expanded how-to for Settings (locked with ui-naming). */
export function installHowForMode(mode: InstallOfferMode): string | null {
  switch (mode) {
    case 'ios':
      return SETTINGS_INSTALL.iosHow;
    case 'firefox':
      return SETTINGS_INSTALL.firefoxHow;
    case 'manual':
      return SETTINGS_INSTALL.manualHow;
    default:
      return null;
  }
}

/**
 * Quiet welcome nudge after first chat: one door into Settings (Home screen + vault).
 * Hidden when dismissed, empty, installed with a vault key, or nothing left to offer.
 */
export function shouldOfferWelcome(opts: {
  installMode: InstallOfferMode;
  dismissed: boolean;
  hasLocalChats: boolean;
  hasVaultKey: boolean;
}): boolean {
  if (!opts.hasLocalChats || opts.dismissed) return false;
  const needsInstall = opts.installMode !== 'none';
  const needsVault = !opts.hasVaultKey;
  return needsInstall || needsVault;
}

export function readDismissed(key: string, storage: Storage | null = safeStorage()): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(key) === '1';
  } catch {
    return false;
  }
}

/** True if the welcome nudge was dismissed (new key or either legacy key). */
export function readWelcomeDismissed(storage: Storage | null = safeStorage()): boolean {
  return (
    readDismissed(WELCOME_DISMISS_KEY, storage) ||
    readDismissed(INSTALL_DISMISS_KEY, storage) ||
    readDismissed(VAULT_NUDGE_DISMISS_KEY, storage)
  );
}

export function writeDismissed(key: string, storage: Storage | null = safeStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(key, '1');
  } catch {
    /* ignore quota */
  }
}

export function writeWelcomeDismissed(storage: Storage | null = safeStorage()): void {
  writeDismissed(WELCOME_DISMISS_KEY, storage);
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

/** Locked microcopy — keep in sync with ui-naming.md. */
export const WELCOME_NUDGE = {
  bodyBefore: 'Chats stay in this browser. Pin Ogma so you can open them again —',
  openSettings: 'Settings',
  bodyAfter: '.',
  dismiss: 'Dismiss',
} as const;

/** Settings splash when home screen and/or vault key still need setup. */
export const SETTINGS_SETUP = {
  title: 'Keep your chats handy',
  installWhy: 'Pin Ogma to your home screen so you can open it like an app next time.',
  vaultWhy: 'Add a vault key to lock these chats or open them on another device.',
  installAction: 'Install Ogma',
  vaultAction: 'Add vault key',
} as const;

export function shouldShowSettingsSetup(opts: {
  installMode: InstallOfferMode;
  hasVaultKey: boolean;
}): boolean {
  return opts.installMode !== 'none' || !opts.hasVaultKey;
}

export const SETTINGS_INSTALL = {
  heading: 'Home screen',
  bodyInstalled: 'Ogma is installed on this device.',
  bodyPrompt: 'Add Ogma to your home screen so you can open it like an app.',
  bodyIos: 'Add Ogma to your home screen: Share → Add to Home Screen.',
  bodyFirefox:
    'Firefox can’t install Ogma the way Chrome can. Open this link in Chrome, then use the install icon in the address bar.',
  bodyManual: 'Add Ogma with the install icon in the address bar (Chrome or Edge).',
  actionPrompt: 'Install Ogma',
  iosHow: 'Share → Add to Home Screen',
  firefoxHow:
    'For a real home-screen app, open this same Ogma link in Chrome, then use the install icon in the address bar.',
  manualHow: 'Use the install icon in the address bar (Chrome or Edge), or your browser’s Install control.',
} as const;
