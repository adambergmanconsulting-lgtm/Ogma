import { bytesToB64Url } from '../crypto/bytes';

/** High-entropy vault key shown once at create. */
export function generateVaultKey(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return bytesToB64Url(bytes);
}
