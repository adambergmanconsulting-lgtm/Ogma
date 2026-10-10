/** Web Crypto seal/open for Loom (and reusable helpers). Spec: docs/engineering/protocols/loom-sync.md */

import { b64ToBytes, bytesToB64, toBufferSource } from './bytes';

const INFO_ENC = 'ogma-loom-enc-v1';

function toBytes(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function deriveEncKey(spaceSecret: string): Promise<CryptoKey> {
  const ikm = toBytes(spaceSecret);
  const base = await crypto.subtle.importKey('raw', toBufferSource(ikm), 'HKDF', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: toBufferSource(new Uint8Array(0)),
      info: toBufferSource(toBytes(INFO_ENC)),
    },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Public swarm id that does not reveal the capability secret. */
export async function publicSpaceId(spaceSecret: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', toBufferSource(toBytes(spaceSecret)));
  return Array.from(new Uint8Array(digest).slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join(
    '',
  );
}

/** Sealed Loom plaintext (inside AES-GCM). Legacy `{ text }` still opens as text. */
export type LoomSealPayload = { kind: 'text'; text: string } | { kind: 'join' };

export async function sealPayload(
  spaceSecret: string,
  payload: LoomSealPayload,
): Promise<{
  nonce: string;
  ciphertext: string;
}> {
  const key = await deriveEncKey(spaceSecret);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const body =
    payload.kind === 'join' ? { kind: 'join' as const } : { kind: 'text' as const, text: payload.text };
  const plain = new TextEncoder().encode(JSON.stringify(body));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toBufferSource(nonce) },
    key,
    toBufferSource(plain),
  );
  return {
    nonce: bytesToB64(nonce),
    ciphertext: bytesToB64(new Uint8Array(cipher)),
  };
}

export async function openPayload(
  spaceSecret: string,
  nonceB64: string,
  ciphertextB64: string,
): Promise<LoomSealPayload> {
  const key = await deriveEncKey(spaceSecret);
  const nonce = b64ToBytes(nonceB64);
  const ciphertext = b64ToBytes(ciphertextB64);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toBufferSource(nonce) },
    key,
    toBufferSource(ciphertext),
  );
  const parsed = JSON.parse(new TextDecoder().decode(plain)) as {
    kind?: unknown;
    text?: unknown;
  };
  if (parsed?.kind === 'join') return { kind: 'join' };
  if (parsed?.kind === 'text' && typeof parsed.text === 'string') {
    return { kind: 'text', text: parsed.text };
  }
  // Legacy envelopes: `{ "text": "..." }` without kind.
  if (typeof parsed?.text === 'string') {
    return { kind: 'text', text: parsed.text };
  }
  throw new Error('Invalid payload');
}

export async function sealText(
  spaceSecret: string,
  text: string,
): Promise<{
  nonce: string;
  ciphertext: string;
}> {
  return sealPayload(spaceSecret, { kind: 'text', text });
}

export async function openText(
  spaceSecret: string,
  nonceB64: string,
  ciphertextB64: string,
): Promise<string> {
  const payload = await openPayload(spaceSecret, nonceB64, ciphertextB64);
  if (payload.kind !== 'text') throw new Error('Not a text payload');
  return payload.text;
}
