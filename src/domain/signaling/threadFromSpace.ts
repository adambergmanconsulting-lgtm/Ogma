import { bytesToB64Url, toBufferSource } from '../crypto/bytes';

/**
 * Deterministic Thread room secret from a Loom space secret.
 * Anyone with the space invite can join the same call via Call in that chat.
 */
export async function threadSecretFromSpace(spaceSecret: string): Promise<string> {
  const material = new TextEncoder().encode(`${spaceSecret}\0ogma-thread-from-space-v1`);
  const digest = await crypto.subtle.digest('SHA-256', toBufferSource(material));
  return bytesToB64Url(new Uint8Array(digest).slice(0, 16));
}
