import type { ConnectionState } from '../types';

/** Status line while in a Thread call. */
export function connectionLabel(
  state: ConnectionState,
  remoteCount: number,
  openRelays: number,
): string {
  if (state !== 'connected') return state;
  if (remoteCount > 0) return 'Connected';
  return openRelays > 0 ? 'Waiting for others…' : 'Connecting to trackers…';
}
