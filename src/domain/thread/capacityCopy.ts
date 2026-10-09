/** Locked capacity microcopy — see ui-naming Capacity notice / Capacity full. */

export function capacityWarningLabel(
  peerCount: number,
  maxPeers: number,
  warnPeers: number,
): string | null {
  if (peerCount < warnPeers) return null;
  return `${peerCount} of ${maxPeers} — quality may drop`;
}

export function roomFullLabel(maxPeers: number): string {
  return `Room full (${maxPeers} max)`;
}
