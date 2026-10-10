import { expect, test } from '@playwright/test';

/**
 * M1.5 hub spike (thread-topology.md): prove a received MediaStreamTrack can be
 * added outbound on another RTCPeerConnection without MCU re-encode.
 * Chromium only in this harness; WebKit still open for go/no-go.
 */
test.describe('hub forward spike', () => {
  test('Chromium can forward a received track outbound', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const waitIce = (pc: RTCPeerConnection) =>
        new Promise<void>((resolve) => {
          if (pc.iceGatheringState === 'complete') {
            resolve();
            return;
          }
          pc.addEventListener('icegatheringstatechange', () => {
            if (pc.iceGatheringState === 'complete') resolve();
          });
        });

      const connect = async (a: RTCPeerConnection, b: RTCPeerConnection) => {
        a.onicecandidate = (e) => {
          if (e.candidate) void b.addIceCandidate(e.candidate);
        };
        b.onicecandidate = (e) => {
          if (e.candidate) void a.addIceCandidate(e.candidate);
        };
        const offer = await a.createOffer();
        await a.setLocalDescription(offer);
        await waitIce(a);
        await b.setRemoteDescription(a.localDescription!);
        const answer = await b.createAnswer();
        await b.setLocalDescription(answer);
        await waitIce(b);
        await a.setRemoteDescription(b.localDescription!);
      };

      const leafA = new RTCPeerConnection();
      const hubIn = new RTCPeerConnection();
      const hubOut = new RTCPeerConnection();
      const leafB = new RTCPeerConnection();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const outbound = stream.getVideoTracks()[0];
      if (!outbound) {
        stream.getTracks().forEach((t) => t.stop());
        return { ok: false as const, reason: 'no-video-track' };
      }
      leafA.addTrack(outbound, stream);

      const inboundPromise = new Promise<MediaStreamTrack>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error('no-inbound')), 15_000);
        hubIn.ontrack = (ev) => {
          window.clearTimeout(timer);
          resolve(ev.track);
        };
      });

      await connect(leafA, hubIn);
      const received = await inboundPromise;

      try {
        hubOut.addTrack(received);
      } catch (err) {
        stream.getTracks().forEach((t) => t.stop());
        leafA.close();
        hubIn.close();
        hubOut.close();
        leafB.close();
        return {
          ok: false as const,
          reason: 'addTrack-failed',
          detail: err instanceof Error ? err.message : String(err),
        };
      }

      const leafBTrack = new Promise<MediaStreamTrack>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error('no-forwarded')), 15_000);
        leafB.ontrack = (ev) => {
          window.clearTimeout(timer);
          resolve(ev.track);
        };
      });

      await connect(hubOut, leafB);
      const forwarded = await leafBTrack;

      const ok =
        forwarded.kind === 'video' &&
        (forwarded.readyState === 'live' || forwarded.readyState === 'muted');

      stream.getTracks().forEach((t) => t.stop());
      leafA.close();
      hubIn.close();
      hubOut.close();
      leafB.close();

      return {
        ok,
        kind: forwarded.kind,
        readyState: forwarded.readyState,
        sameId: forwarded.id === received.id,
      };
    });

    expect(result.ok, JSON.stringify(result)).toBe(true);
  });
});
