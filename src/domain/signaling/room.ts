/** Capability URL helpers — docs/engineering/protocols/capability-urls.md */

export type CapabilityKind = 'room' | 'space';

export interface ParsedCapability {
  kind: CapabilityKind;
  secret: string;
}

/** Parse `#room=`, `#space=`, or legacy bare room id. */
export function parseCapabilityFromHash(hash: string): ParsedCapability | null {
  const raw = hash.replace(/^#/, '').trim();
  if (!raw) return null;

  if (raw.startsWith('room=')) {
    const secret = decodeURIComponent(raw.slice('room='.length));
    return secret ? { kind: 'room', secret } : null;
  }

  if (raw.startsWith('space=')) {
    const secret = decodeURIComponent(raw.slice('space='.length));
    return secret ? { kind: 'space', secret } : null;
  }

  const pathRoom = raw.match(/^\/?room\/([^/?#]+)/i);
  if (pathRoom?.[1]) {
    return { kind: 'room', secret: decodeURIComponent(pathRoom[1]) };
  }

  if (/^[a-z0-9_-]{6,128}$/i.test(raw)) {
    return { kind: 'room', secret: raw };
  }

  return null;
}

/** @deprecated use parseCapabilityFromHash */
export function parseRoomIdFromHash(hash: string): string | null {
  const parsed = parseCapabilityFromHash(hash);
  return parsed?.kind === 'room' ? parsed.secret : null;
}

/**
 * Room secret from the current location.
 * Prefer `?room=` (survives Slack/WhatsApp/etc., which often strip hashes).
 * Fall back to `#room=` for older links.
 */
export function parseRoomIdFromLocation(
  loc: Pick<Location, 'search' | 'hash'> = globalThis.location,
): string | null {
  const fromQuery = new URLSearchParams(loc.search).get('room')?.trim();
  if (fromQuery) return fromQuery;
  return parseRoomIdFromHash(loc.hash);
}

export function roomHash(roomId: string): string {
  return `#room=${encodeURIComponent(roomId)}`;
}

export function spaceHash(spaceSecret: string): string {
  return `#space=${encodeURIComponent(spaceSecret)}`;
}

/** App base path from Vite (`/` locally, `/Ogma/` on GitHub Pages). */
function appBaseUrl(): URL {
  const base = import.meta.env.BASE_URL || '/';
  return new URL(base, globalThis.location?.origin ?? 'http://localhost');
}

/**
 * Canonical invite link — `?room=` so messengers that strip `#…` still carry the secret.
 */
export function roomShareUrl(roomId: string): string {
  const url = appBaseUrl();
  url.searchParams.set('room', roomId);
  url.hash = '';
  return url.href;
}

/** Keep path + set `?room=` (clears legacy hash). */
export function replaceUrlWithRoom(roomId: string): void {
  const url = appBaseUrl();
  url.searchParams.set('room', roomId);
  url.hash = '';
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}

export function clearRoomFromUrl(): void {
  const url = appBaseUrl();
  url.searchParams.delete('room');
  url.hash = '';
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}

/** Short code both people can read aloud to confirm same room. */
export function roomDisplayCode(roomId: string): string {
  return roomId.slice(0, 6).toUpperCase();
}

/** 128-bit URL-safe secret for Thread rooms. */
export function createRoomSecret(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

function base64Url(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
