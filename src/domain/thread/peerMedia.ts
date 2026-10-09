/** Reliable A/V helpers — bypass Trystero stream-meta / addStream owner quirks. */

export type PeerStreamHandler = (peerId: string, stream: MediaStream) => void;

/**
 * Listen for inbound tracks on a peer connection and emit a merged MediaStream.
 * Uses addEventListener so Trystero's own ontrack handler still runs.
 */
export function watchPeerTracks(
  pc: RTCPeerConnection,
  peerId: string,
  onStream: PeerStreamHandler,
): () => void {
  let composite: MediaStream | null = null;

  const ensureComposite = (): MediaStream => {
    if (!composite) composite = new MediaStream();
    return composite;
  };

  const ingest = (track: MediaStreamTrack, from?: MediaStream) => {
    if (track.readyState === 'ended') return;
    const stream = ensureComposite();
    if (!stream.getTracks().some((t) => t.id === track.id)) {
      stream.addTrack(track);
    }
    if (from) {
      for (const t of from.getTracks()) {
        if (!stream.getTracks().some((x) => x.id === t.id) && t.readyState !== 'ended') {
          stream.addTrack(t);
        }
      }
    }
    track.addEventListener(
      'ended',
      () => {
        try {
          stream.removeTrack(track);
        } catch {
          // ignore
        }
        if (stream.getTracks().length) onStream(peerId, stream);
      },
      { once: true },
    );
    onStream(peerId, stream);
  };

  const onTrack = (event: Event) => {
    const e = event as RTCTrackEvent;
    ingest(e.track, e.streams[0]);
  };

  pc.addEventListener('track', onTrack);

  for (const receiver of pc.getReceivers()) {
    const track = receiver.track;
    if (track && track.readyState !== 'ended') ingest(track);
  }

  return () => {
    pc.removeEventListener('track', onTrack);
    composite = null;
  };
}

/**
 * Attach (or replace) local tracks on a peer connection directly.
 * Triggers negotiationneeded on the shared PC Trystero already owns.
 */
export function publishTracksToPeer(pc: RTCPeerConnection, stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    if (track.readyState === 'ended') continue;
    const sender = pc.getSenders().find((s) => s.track?.kind === track.kind);
    if (sender) {
      // Same track already sending — skip (avoids renegotiate/audio glitches).
      if (sender.track?.id === track.id) continue;
      if (sender.track !== track) void sender.replaceTrack(track);
    } else {
      pc.addTrack(track, stream);
    }
  }
}
