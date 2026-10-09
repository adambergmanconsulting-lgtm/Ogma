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

export async function shareRoomLink(url: string): Promise<void> {
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Ogma room', url, text: 'Join my Ogma call' });
      return;
    }
  } catch {
    // cancelled — clipboard fallback
  }
  await navigator.clipboard?.writeText(url);
}
