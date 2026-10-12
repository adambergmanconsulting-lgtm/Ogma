/**
 * In-tab presence for chat / call: title flash, favicon badge, vibrate.
 * No push — closed app stays silent (overview non-goals).
 */

const BASE_TITLE = 'Ogma';
const FAVICON_SELECTOR = 'link[rel="icon"]';

let flashTimer: ReturnType<typeof setInterval> | null = null;
let flashKind: 'chat' | 'call' | null = null;
let flashOn = false;
let baseHref: string | null = null;

function faviconLink(): HTMLLinkElement | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector(FAVICON_SELECTOR);
}

function ensureBaseHref(): string {
  if (baseHref) return baseHref;
  const link = faviconLink();
  baseHref = link?.href || '/favicon.svg';
  return baseHref;
}

function badgedFaviconHref(): string {
  // Inline SVG with a red corner badge — no extra asset.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0f172a"/>
  <path d="M32 10v44" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
  <path d="M32 16h14M32 21h14" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M32 28h10M32 33h10M32 38h10" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M22 46h20M22 51h20" stroke="#fef08a" stroke-width="2.5" stroke-linecap="round" opacity="0.95"/>
  <circle cx="50" cy="14" r="10" fill="#ef4444"/>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function setFavicon(href: string): void {
  const link = faviconLink();
  if (!link) return;
  link.href = href;
}

function setTitle(text: string): void {
  if (typeof document === 'undefined') return;
  document.title = text;
}

function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // unsupported / denied
  }
}

function tickFlash(): void {
  flashOn = !flashOn;
  if (flashKind === 'call') {
    setTitle(flashOn ? 'Incoming call · Ogma' : BASE_TITLE);
  } else {
    setTitle(flashOn ? 'New message · Ogma' : BASE_TITLE);
  }
  setFavicon(flashOn ? badgedFaviconHref() : ensureBaseHref());
}

/** Start or refresh tab flash for chat / call. */
export function startTabAlert(kind: 'chat' | 'call'): void {
  if (typeof document === 'undefined') return;
  ensureBaseHref();
  flashKind = kind;
  if (flashTimer) return;
  flashOn = false;
  tickFlash();
  flashTimer = setInterval(tickFlash, 900);
}

export function stopTabAlert(): void {
  if (flashTimer) {
    clearInterval(flashTimer);
    flashTimer = null;
  }
  flashKind = null;
  flashOn = false;
  setTitle(BASE_TITLE);
  if (baseHref) setFavicon(baseHref);
}

export function pulseChatAlert(): void {
  vibrate(40);
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    startTabAlert('chat');
  }
}

export function pulseCallAlert(): void {
  vibrate([120, 80, 120, 80, 200]);
  startTabAlert('call');
}

/** Clear chat title flash when the user focuses the app (call keeps ringing until stop). */
export function onAppBecameVisible(opts: { incomingCall: boolean }): void {
  if (opts.incomingCall) return;
  if (flashKind === 'chat') stopTabAlert();
}
