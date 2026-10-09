import { b64ToBytes, bytesToB64, toBufferSource } from '../crypto/bytes';
import type { DeviceKeyMeta } from './types';

const PBKDF2_ITERS = 210_000;
const VERIFIER_PLAIN = 'ogma-device-key-ok';

async function deriveWrapKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    'raw',
    toBufferSource(new TextEncoder().encode(passphrase)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: toBufferSource(salt),
      iterations: PBKDF2_ITERS,
    },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Create device-key meta from a new passphrase (stores only salt + verifier). */
export async function createDeviceKeyMeta(passphrase: string): Promise<DeviceKeyMeta> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveWrapKey(passphrase, salt);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toBufferSource(nonce) },
    key,
    toBufferSource(new TextEncoder().encode(VERIFIER_PLAIN)),
  );
  return {
    saltB64: bytesToB64(salt),
    verifierNonceB64: bytesToB64(nonce),
    verifierCipherB64: bytesToB64(new Uint8Array(cipher)),
  };
}

export async function unlockDeviceKey(
  passphrase: string,
  meta: DeviceKeyMeta,
): Promise<CryptoKey> {
  const salt = b64ToBytes(meta.saltB64);
  const key = await deriveWrapKey(passphrase, salt);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toBufferSource(b64ToBytes(meta.verifierNonceB64)) },
    key,
    toBufferSource(b64ToBytes(meta.verifierCipherB64)),
  );
  if (new TextDecoder().decode(plain) !== VERIFIER_PLAIN) {
    throw new Error('Invalid device key');
  }
  return key;
}

/** Wrap a space secret for Remember / backup. */
export async function wrapSpaceSecret(wrapKey: CryptoKey, spaceSecret: string): Promise<string> {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toBufferSource(nonce) },
    wrapKey,
    toBufferSource(new TextEncoder().encode(spaceSecret)),
  );
  const packed = new Uint8Array(12 + cipher.byteLength);
  packed.set(nonce, 0);
  packed.set(new Uint8Array(cipher), 12);
  return bytesToB64(packed);
}

export async function unwrapSpaceSecret(wrapKey: CryptoKey, wrappedB64: string): Promise<string> {
  const packed = b64ToBytes(wrappedB64);
  if (packed.byteLength < 13) throw new Error('Invalid wrapped secret');
  const nonce = packed.slice(0, 12);
  const cipher = packed.slice(12);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toBufferSource(nonce) },
    wrapKey,
    toBufferSource(cipher),
  );
  return new TextDecoder().decode(plain);
}

/** Fill spaceId → secret for rows that have wrappedSecret. */
export async function loadRememberedSecrets(
  wrapKey: CryptoKey,
  rows: { spaceId: string; wrappedSecret?: string }[],
  into: Map<string, string>,
): Promise<void> {
  for (const row of rows) {
    if (!row.wrappedSecret) continue;
    try {
      into.set(row.spaceId, await unwrapSpaceSecret(wrapKey, row.wrappedSecret));
    } catch {
      // skip bad wrap
    }
  }
}
