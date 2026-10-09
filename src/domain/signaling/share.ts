import { parseCapabilityFromHash } from './room';

export function extractRoomSecret(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.includes('#')) {
      const url = new URL(trimmed, globalThis.location?.origin ?? 'http://local');
      const parsed = parseCapabilityFromHash(url.hash);
      return parsed?.kind === 'room' ? parsed.secret : null;
    }
  } catch {
    // fall through
  }
  const parsed = parseCapabilityFromHash(`#${trimmed}`);
  if (parsed?.kind === 'room') return parsed.secret;
  return trimmed.match(/^[a-z0-9_-]{6,128}$/i) ? trimmed : null;
}

export type ShareResult =
  | { ok: true; method: 'clipboard' | 'share' }
  | { ok: false; reason: 'cancelled' | 'failed'; url: string };

function prefersNativeShare(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  // Desktop "Share link" almost always means copy; native share sheets feel broken there.
  const coarse = globalThis.matchMedia?.('(pointer: coarse)').matches;
  return Boolean(coarse);
}

async function copyWithClipboardApi(url: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

function copyWithExecCommand(url: string): boolean {
  try {
    const el = document.createElement('textarea');
    el.value = url;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Copy the room link (desktop). On phones, offer the system share sheet first.
 * Always returns a result so the UI can confirm or show the URL for manual copy.
 */
export async function shareRoomLink(url: string): Promise<ShareResult> {
  if (prefersNativeShare()) {
    try {
      const payload: ShareData = { title: 'Ogma room', url, text: url };
      if (!navigator.canShare || navigator.canShare(payload)) {
        await navigator.share(payload);
        return { ok: true, method: 'share' };
      }
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'AbortError') return { ok: false, reason: 'cancelled', url };
      // fall through to clipboard
    }
  }

  if (await copyWithClipboardApi(url) || copyWithExecCommand(url)) {
    return { ok: true, method: 'clipboard' };
  }

  return { ok: false, reason: 'failed', url };
}
