import { defaultRelayUrls, getRelaySockets } from '@trystero-p2p/torrent';

export const TRYSTERO_APP_ID = 'ogma-thread-v1';
export const THREAD_TRACKER_URLS = [...defaultRelayUrls];

export type RelayHealth = { url: string; readyState: number };

export function listRelayHealth(): RelayHealth[] {
  const sockets = getRelaySockets() as Record<string, WebSocket | undefined>;
  return Object.entries(sockets).map(([url, socket]) => ({
    url,
    readyState: socket?.readyState ?? WebSocket.CLOSED,
  }));
}

const WS_OPEN = 1;

export function countOpenRelays(health = listRelayHealth()): number {
  return health.filter((h) => h.readyState === WS_OPEN).length;
}
