import {
  parseCapabilityFromHash,
  parseRoomIdFromLocation,
  parseSpaceSecretFromLocation,
} from './room';

export function extractRoomSecret(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    if (/^https?:\/\//i.test(trimmed) || trimmed.includes('?') || trimmed.includes('#')) {
      const url = new URL(trimmed, globalThis.location?.origin ?? 'http://local');
      const fromLoc = parseRoomIdFromLocation(url);
      if (fromLoc) return fromLoc;
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

export function extractSpaceSecret(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    if (/^https?:\/\//i.test(trimmed) || trimmed.includes('?') || trimmed.includes('#')) {
      const url = new URL(trimmed, globalThis.location?.origin ?? 'http://local');
      const fromLoc = parseSpaceSecretFromLocation(url);
      if (fromLoc) return fromLoc;
      const parsed = parseCapabilityFromHash(url.hash);
      return parsed?.kind === 'space' ? parsed.secret : null;
    }
  } catch {
    // fall through
  }
  if (trimmed.startsWith('space=')) {
    return decodeURIComponent(trimmed.slice('space='.length)) || null;
  }
  const parsed = parseCapabilityFromHash(`#${trimmed}`);
  if (parsed?.kind === 'space') return parsed.secret;
  return trimmed.match(/^[a-z0-9_-]{6,128}$/i) ? trimmed : null;
}

export type InviteSecrets = {
  room: string | null;
  space: string | null;
};

/**
 * Home **Have an invite?** paste: full share URL or fragment.
 * Room and space may both be present (Call-from-chat). Bare opaque id → space
 * (same as historical home Join).
 */
export function extractInviteSecrets(input: string): InviteSecrets {
  const trimmed = input.trim();
  if (!trimmed) return { room: null, space: null };

  try {
    if (/^https?:\/\//i.test(trimmed) || trimmed.includes('?') || trimmed.includes('#')) {
      const url = new URL(trimmed, globalThis.location?.origin ?? 'http://local');
      return {
        room: parseRoomIdFromLocation(url),
        space: parseSpaceSecretFromLocation(url),
      };
    }
  } catch {
    // fall through
  }

  if (trimmed.startsWith('room=') || trimmed.startsWith('space=')) {
    const parsed = parseCapabilityFromHash(`#${trimmed}`);
    return {
      room: parsed?.kind === 'room' ? parsed.secret : null,
      space: parsed?.kind === 'space' ? parsed.secret : null,
    };
  }

  if (/^[a-z0-9_-]{6,128}$/i.test(trimmed)) {
    return { room: null, space: trimmed };
  }

  return { room: null, space: null };
}

export type ShareResult =
  | { ok: true; method: 'clipboard' | 'share' }
  | { ok: false; reason: 'cancelled' | 'failed'; url: string };

function prefersNativeShare(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
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

/** Copy the invite URL (desktop). On phones, try the system share sheet first. */
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
    }
  }

  if ((await copyWithClipboardApi(url)) || copyWithExecCommand(url)) {
    return { ok: true, method: 'clipboard' };
  }

  return { ok: false, reason: 'failed', url };
}
