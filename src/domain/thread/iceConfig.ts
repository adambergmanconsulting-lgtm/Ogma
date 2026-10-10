import { ICE_SERVERS } from '../types';

/** Optional user TURN (connectivity.md). Off when unset. Privacy trade — relay sees IP / timing. */
export const TURN_URI_STORAGE_KEY = 'ogma.ice.turnUri';

export const TURN_SETTINGS = {
  /** Summary for collapsed disclosure — rare path. */
  summary: 'Network help (optional)',
  heading: 'Network help',
  label: 'TURN URI (optional)',
  body: 'Leave empty for STUN-only. A TURN relay can help on hard networks; the relay may see your IP and timing. Applies on the next join.',
  placeholder: 'turn:host:3478',
  clear: 'Clear TURN',
  save: 'Save TURN',
} as const;

/**
 * Accept turn: / turns: URIs; optional `username:credential@` userinfo.
 * Do not use URL.username for turn: — non-special schemes leave userinfo in pathname.
 */
export function parseTurnUri(raw: string | null | undefined): RTCIceServer | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;
  const m = /^(turns?):(?:([^:@/?#]+):([^@/?#]*)@)?([^/?#]+)(\?[^#]*)?$/i.exec(trimmed);
  if (!m) return null;
  const protocol = m[1]!.toLowerCase();
  const username = m[2] ? decodeURIComponent(m[2]) : undefined;
  const credential = m[3] !== undefined && m[2] ? decodeURIComponent(m[3]) : undefined;
  const hostPort = m[4]!;
  const search = m[5] ?? '';
  if (!hostPort || hostPort.includes('@')) return null;
  const urls = `${protocol}:${hostPort}${search}`;
  const server: RTCIceServer = { urls };
  if (username) server.username = username;
  if (credential !== undefined && username) server.credential = credential;
  return server;
}

export function readStoredTurnUri(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage !== 'undefined'
    ? localStorage
    : null,
): string {
  if (!storage) return '';
  try {
    return storage.getItem(TURN_URI_STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function writeStoredTurnUri(
  uri: string,
  storage: Pick<Storage, 'setItem' | 'removeItem'> | null = typeof localStorage !==
  'undefined'
    ? localStorage
    : null,
): { ok: true } | { ok: false; reason: 'invalid' } {
  const trimmed = uri.trim();
  if (!trimmed) {
    try {
      storage?.removeItem(TURN_URI_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return { ok: true };
  }
  if (!parseTurnUri(trimmed)) return { ok: false, reason: 'invalid' };
  try {
    storage?.setItem(TURN_URI_STORAGE_KEY, trimmed);
  } catch {
    /* ignore */
  }
  return { ok: true };
}

/** STUN defaults plus optional user TURN. */
export function buildIceServers(
  turnUri: string | null | undefined = readStoredTurnUri(),
): RTCIceServer[] {
  const turn = parseTurnUri(turnUri);
  return turn ? [...ICE_SERVERS, turn] : [...ICE_SERVERS];
}
