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

/** Loom space secret from location (`#space=` or `?space=`). */
export function parseSpaceSecretFromLocation(
  loc: Pick<Location, 'search' | 'hash'> = globalThis.location,
): string | null {
  const fromQuery = new URLSearchParams(loc.search).get('space')?.trim();
  if (fromQuery) return fromQuery;
  const parsed = parseCapabilityFromHash(loc.hash);
  return parsed?.kind === 'space' ? parsed.secret : null;
}

/** Share URL for a Loom space (`#space=` — capability in fragment). */
export function spaceShareUrl(spaceSecret: string): string {
  const url = appBaseUrl();
  url.search = '';
  url.hash = `space=${encodeURIComponent(spaceSecret)}`;
  return url.href;
}

export function replaceUrlWithSpace(spaceSecret: string): void {
  const url = appBaseUrl();
  url.search = '';
  url.hash = `space=${encodeURIComponent(spaceSecret)}`;
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

/** 128-bit URL-safe secret for Loom spaces (same generator as rooms). */
export function createSpaceSecret(): string {
  return createRoomSecret();
}

/** App base path from Vite (`/` locally, `/Ogma/` on GitHub Pages). */
function appBaseUrl(): URL {
  const base = import.meta.env.BASE_URL || '/';
  return new URL(base, globalThis.location?.origin ?? 'http://localhost');
}

export type RoomShareOpts = {
  /** When set, invite also carries `#space=` so Call chat is the Loom log. */
  spaceSecret?: string;
};

/**
 * Canonical invite — `?room=<secret>` (survives messengers that strip `#…`).
 * Space-bound calls add `#space=` so guests share the same chat history.
 */
export function roomShareUrl(roomId: string, opts?: RoomShareOpts): string {
  const url = appBaseUrl();
  url.searchParams.set('room', roomId);
  url.hash = opts?.spaceSecret ? `space=${encodeURIComponent(opts.spaceSecret)}` : '';
  return url.href;
}

/** Keep path + set `?room=` (optional `#space=` for Call-from-chat). */
export function replaceUrlWithRoom(roomId: string, opts?: RoomShareOpts): void {
  const url = appBaseUrl();
  url.searchParams.set('room', roomId);
  url.hash = opts?.spaceSecret ? `space=${encodeURIComponent(opts.spaceSecret)}` : '';
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

export function clearRoomFromUrl(): void {
  const space = parseSpaceSecretFromLocation();
  const url = appBaseUrl();
  url.searchParams.delete('room');
  url.hash = space ? `space=${encodeURIComponent(space)}` : '';
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
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
