/** One shared picture replaces the camera. The browser picker chooses screen, window, or tab. */

export function canShareScreen(): boolean {
  return typeof navigator.mediaDevices?.getDisplayMedia === 'function';
}

function errorName(err: unknown): string {
  if (!err || typeof err !== 'object' || !('name' in err)) return '';
  return String(err.name);
}

/** User closed the picker. Not a failure to show. */
export function isScreenShareCancelled(err: unknown): boolean {
  const name = errorName(err);
  return name === 'NotAllowedError' || name === 'AbortError';
}

/** Null when the picker was closed. A sentence when sharing did not start. */
export function screenShareFailure(err: unknown): string | null {
  if (isScreenShareCancelled(err)) return null;
  if (errorName(err) === 'NotSupportedError') {
    return "This browser can't share a screen. Open Ogma in Chrome or Edge.";
  }
  return "Couldn't share the screen";
}

/** Camera stays live underneath. Send video while the screen is up even if the camera is off. */
export function shouldSendLocalVideo(cameraEnabled: boolean, sharingScreen: boolean): boolean {
  return cameraEnabled || sharingScreen;
}

/** Who fills the main video pane while a screen is shared (local wins if both). */
export type ScreenSpotlight =
  | { kind: 'local' }
  | { kind: 'remote'; peerId: string };

export function resolveScreenSpotlight(opts: {
  localScreen: boolean;
  remotePeers: ReadonlyArray<{ peerId: string; sharingScreen?: boolean }>;
}): ScreenSpotlight | null {
  if (opts.localScreen) return { kind: 'local' };
  const peer = opts.remotePeers.find((p) => p.sharingScreen);
  return peer ? { kind: 'remote', peerId: peer.peerId } : null;
}

export async function captureScreenTrack(): Promise<MediaStreamTrack> {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  const track =
    stream.getVideoTracks().find((t) => t.readyState === 'live') ?? stream.getVideoTracks()[0];
  if (!track) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error('No screen video');
  }
  try {
    track.contentHint = 'detail';
  } catch {
    // Some browsers expose contentHint without a setter.
  }
  return track;
}
