import type { LinkQuality } from '../media/sendQuality';

/** Locked link-quality microcopy — see ui-naming Link quality rows. */
export function linkQualityLabel(
  quality: LinkQuality,
  videoPaused: boolean,
  peerName?: string | null,
): string | null {
  if (quality === 'good') return null;
  const name = peerName?.trim();
  const withWhom = name ? ` with ${name}` : '';
  if (videoPaused) return `Weak connection${withWhom} — video paused`;
  return `Weak connection${withWhom} — lowering video`;
}
