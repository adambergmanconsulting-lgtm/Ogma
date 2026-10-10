import type { ConnectionState } from '../types';

const DEFAULT_ERROR_LABEL = "Couldn't connect";

/** Status line while in a Thread call. */
export function connectionLabel(
  state: ConnectionState,
  remoteCount: number,
  openRelays: number,
  errorMessage?: string | null,
): string {
  switch (state) {
    case 'idle':
      return '';
    case 'joining':
      return 'Joining…';
    case 'reconnecting':
      return 'Reconnecting…';
    case 'left':
      return 'Left';
    case 'error':
      return errorMessage?.trim() || DEFAULT_ERROR_LABEL;
    case 'connected':
      if (remoteCount > 0) return 'Connected';
      return openRelays > 0 ? 'Waiting…' : 'Connecting…';
    default:
      return state;
  }
}
