import type { SendQualityTier } from './constraints';

/** Soft max bitrate (bps) by room size, speaking tier, and congestion. */
export function maxVideoBitrateBps(
  peerCount: number,
  tier: SendQualityTier = 'high',
  congested = false,
): number {
  const n = Math.max(1, peerCount);
  let base: number;
  if (n <= 2) base = 1_500_000;
  else if (n <= 4) base = 900_000;
  else base = 500_000;

  if (tier === 'low') base = Math.round(base * 0.45);
  if (congested) base = Math.round(base * 0.55);
  return Math.max(120_000, base);
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

type OutboundRtpStats = {
  packetsLost?: number;
  packetsSent?: number;
  roundTripTime?: number;
};

/** True when recent outbound stats look congested. */
export async function sampleOutboundCongestion(
  pcs: RTCPeerConnection[],
): Promise<boolean> {
  let lost = 0;
  let sent = 0;
  let rttSum = 0;
  let rttN = 0;

  for (const pc of pcs) {
    let report: RTCStatsReport;
    try {
      report = await pc.getStats();
    } catch {
      continue;
    }
    report.forEach((stat) => {
      if (stat.type === 'outbound-rtp' && (stat as { kind?: string }).kind === 'video') {
        const s = stat as OutboundRtpStats;
        lost += s.packetsLost ?? 0;
        sent += s.packetsSent ?? 0;
      }
      if (stat.type === 'remote-inbound-rtp' && (stat as { kind?: string }).kind === 'video') {
        const rtt = (stat as OutboundRtpStats).roundTripTime;
        if (typeof rtt === 'number') {
          rttSum += rtt;
          rttN += 1;
        }
      }
    });
  }

  if (sent > 80 && lost / sent > 0.05) return true;
  if (rttN > 0 && rttSum / rttN > 0.35) return true;
  return false;
}
