import type { LinkQuality, SendQualityTier } from './constraints';

export type { LinkQuality };

const QUALITY_RANK: Record<LinkQuality, number> = {
  good: 0,
  fair: 1,
  poor: 2,
};

/** Soft max bitrate (bps) by room size, speaking tier, and link quality. */
export function maxVideoBitrateBps(
  peerCount: number,
  tier: SendQualityTier = 'high',
  linkQuality: LinkQuality | boolean = 'good',
): number {
  const n = Math.max(1, peerCount);
  let base: number;
  if (n <= 2) base = 1_500_000;
  else if (n <= 4) base = 900_000;
  else base = 500_000;

  if (tier === 'low') base = Math.round(base * 0.45);

  const quality = normalizeLinkQuality(linkQuality);
  if (quality === 'fair') base = Math.round(base * 0.55);
  if (quality === 'poor') base = Math.round(base * 0.3);

  const floor = quality === 'poor' ? 80_000 : 120_000;
  return Math.max(floor, base);
}

/** Map legacy `congested` boolean or LinkQuality into LinkQuality. */
export function normalizeLinkQuality(value: LinkQuality | boolean): LinkQuality {
  if (value === true) return 'fair';
  if (value === false) return 'good';
  return value;
}

export function worseLinkQuality(a: LinkQuality, b: LinkQuality): LinkQuality {
  return QUALITY_RANK[a] >= QUALITY_RANK[b] ? a : b;
}

/**
 * Hysteresis: escalate immediately; recover only after `goodStreakNeeded`
 * consecutive better-or-equal samples at the target level.
 */
export function nextLinkQuality(
  prev: LinkQuality,
  sample: LinkQuality,
  goodStreak: number,
  goodStreakNeeded = 2,
): { quality: LinkQuality; goodStreak: number } {
  if (QUALITY_RANK[sample] > QUALITY_RANK[prev]) {
    return { quality: sample, goodStreak: 0 };
  }
  if (sample === prev) {
    return { quality: prev, goodStreak: sample === 'good' ? goodStreak + 1 : 0 };
  }
  // Sample better than prev — need consecutive good-enough windows to step down.
  const streak = goodStreak + 1;
  if (streak < goodStreakNeeded) {
    return { quality: prev, goodStreak: streak };
  }
  // Step one level toward the sample (poor→fair or fair→good), not jump.
  const stepped: LinkQuality =
    prev === 'poor' ? (sample === 'good' ? 'fair' : sample) : sample;
  return { quality: stepped, goodStreak: 0 };
}

export async function applyMaxBitrate(
  pc: RTCPeerConnection,
  maxBitrateBps: number,
): Promise<void> {
  for (const sender of pc.getSenders()) {
    if (sender.track?.kind !== 'video') continue;
    const params = sender.getParameters();
    if (!params.encodings?.length) {
      params.encodings = [{ maxBitrate: maxBitrateBps }];
    } else {
      for (const enc of params.encodings) {
        enc.maxBitrate = maxBitrateBps;
      }
    }
    try {
      await sender.setParameters(params);
    } catch {
      // Some browsers reject mid-flight; ignore.
    }
  }
}

type RtpStats = {
  packetsLost?: number;
  packetsSent?: number;
  packetsReceived?: number;
  roundTripTime?: number;
  kind?: string;
  type: string;
};

/** Classify one peer connection from video RTP stats. */
export function classifyPeerStats(report: Iterable<RtpStats>): LinkQuality {
  let lost = 0;
  let sentOrRecv = 0;
  let rttSum = 0;
  let rttN = 0;

  for (const stat of report) {
    if (stat.type === 'outbound-rtp' && stat.kind === 'video') {
      lost += stat.packetsLost ?? 0;
      sentOrRecv += stat.packetsSent ?? 0;
    }
    if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
      lost += stat.packetsLost ?? 0;
      sentOrRecv += stat.packetsReceived ?? 0;
    }
    if (stat.type === 'remote-inbound-rtp' && stat.kind === 'video') {
      const rtt = stat.roundTripTime;
      if (typeof rtt === 'number') {
        rttSum += rtt;
        rttN += 1;
      }
    }
  }

  const lossRatio = sentOrRecv > 80 ? lost / sentOrRecv : 0;
  const rtt = rttN > 0 ? rttSum / rttN : 0;

  if (lossRatio > 0.08 || rtt > 0.5) return 'poor';
  if (lossRatio > 0.03 || rtt > 0.25) return 'fair';
  return 'good';
}

export type PeerLinkSample = {
  byPeer: Record<string, LinkQuality>;
  worst: LinkQuality;
  weakestPeerId: string | null;
};

/** Sample link quality per mesh peer (keyed RTCPeerConnections). */
export async function samplePeerLinkQuality(
  peers: Record<string, RTCPeerConnection | null | undefined>,
): Promise<PeerLinkSample> {
  const byPeer: Record<string, LinkQuality> = {};
  let worst: LinkQuality = 'good';
  let weakestPeerId: string | null = null;

  for (const [peerId, pc] of Object.entries(peers)) {
    if (!pc) continue;
    let report: RTCStatsReport;
    try {
      report = await pc.getStats();
    } catch {
      continue;
    }
    const stats: RtpStats[] = [];
    report.forEach((stat) => {
      stats.push(stat as RtpStats);
    });
    const quality = classifyPeerStats(stats);
    byPeer[peerId] = quality;
    if (QUALITY_RANK[quality] > QUALITY_RANK[worst]) {
      worst = quality;
      weakestPeerId = peerId;
    } else if (quality === worst && worst !== 'good' && weakestPeerId === null) {
      weakestPeerId = peerId;
    }
  }

  if (worst !== 'good' && weakestPeerId === null) {
    const first = Object.entries(byPeer).find(([, q]) => q === worst);
    weakestPeerId = first?.[0] ?? null;
  }

  return { byPeer, worst, weakestPeerId };
}
