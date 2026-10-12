/**
 * Trystero JoinError is `{ error, appId, roomId, peerId }` (not `.message`).
 * Map known failures to connectivity / ui-naming join copy.
 */

/** Shared when peers meet on trackers but ICE fails, or join fails without detail. */
export const JOIN_PEERS_UNREACHABLE =
  "Couldn't reach peers — this network may block direct connections. Try Settings → Network help.";

export const JOIN_SIGNAL_DECRYPT_FAILED =
  'Could not decrypt peer signaling — reopen the invite link.';

/**
 * Normalize Trystero / Error-shaped join failures for UI.
 * @param fallback used only when nothing useful can be extracted (prefer JOIN_PEERS_UNREACHABLE).
 */
export function joinErrorMessage(
  err: unknown,
  fallback: string = JOIN_PEERS_UNREACHABLE,
): string {
  const raw = extractJoinErrorText(err);
  if (!raw) return fallback;
  return humanizeJoinError(raw) ?? raw;
}

function extractJoinErrorText(err: unknown): string {
  if (typeof err === 'string') {
    const t = err.trim();
    return t && t !== '[object Object]' ? t : '';
  }
  if (!err || typeof err !== 'object') return '';
  const o = err as { error?: unknown; message?: unknown };
  for (const key of ['error', 'message'] as const) {
    const v = o[key];
    if (typeof v === 'string') {
      const t = v.trim();
      if (t && t !== '[object Object]') return t;
    }
  }
  return '';
}

function humanizeJoinError(raw: string): string | null {
  if (/could not connect to peer .+ after exchanging SDP/i.test(raw)) {
    return JOIN_PEERS_UNREACHABLE;
  }
  if (/incorrect room password/i.test(raw)) {
    return JOIN_SIGNAL_DECRYPT_FAILED;
  }
  if (/^handshake failed:\s*/i.test(raw)) {
    const rest = raw.replace(/^handshake failed:\s*/i, '').trim();
    return rest || JOIN_PEERS_UNREACHABLE;
  }
  return null;
}
