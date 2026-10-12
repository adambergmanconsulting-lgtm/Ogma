import { ICE_SERVERS } from '../types';

/** Optional user TURN (connectivity.md). Off when unset. Privacy trade — relay sees IP / timing. */
export const TURN_URI_STORAGE_KEY = 'ogma.ice.turnUri';

export const TURN_SETTINGS = {
  /** Summary for collapsed disclosure — rare path. */
  summary: 'Network help (optional)',
  heading: 'Network help',
  lead: 'When peers meet but never connect, the LAN often blocks direct paths (guest Wi‑Fi / client isolation). Try a network change first; use a TURN relay only if that fails.',
  tryHeading: 'Try a network change',
  trySteps: [
    'Move one device off guest Wi‑Fi, or turn off AP / client isolation on the router.',
    'Put one peer on phone cellular (or a phone hotspot) and retry the invite.',
    'Avoid VPNs on both sides for the call, then rejoin.',
  ],
  relayHeading: 'Or use a TURN relay',
  label: 'TURN URI',
  body: 'Paste a turn: or turns: URI from a provider you pay, or from a relay you run. Leave empty for STUN-only. The relay may see your IP and timing. Applies on the next join.',
  paidNote:
    'Ogma-hosted paid network help is planned — not for sale yet. Until then, buy or run TURN yourself and paste the URI here.',
  placeholder: 'turn:user:pass@host:3478',
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
