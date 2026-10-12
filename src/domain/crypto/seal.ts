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

/** System events in the sealed log (join, Call, screen share). */
export const LOOM_SYSTEM_KINDS = [
  'join',
  'call-start',
  'call-end',
  'screen-share',
  'screen-share-end',
] as const;

export type LoomSystemKind = (typeof LOOM_SYSTEM_KINDS)[number];

export function isLoomSystemKind(kind: string): kind is LoomSystemKind {
  return (LOOM_SYSTEM_KINDS as readonly string[]).includes(kind);
}

/** Sealed Loom plaintext (inside AES-GCM). Legacy `{ text }` still opens as text. */
export type LoomSealPayload =
  | { kind: 'text'; text: string; replaces?: string }
  | { kind: LoomSystemKind };

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
    payload.kind === 'text'
      ? payload.replaces
        ? { kind: 'text' as const, text: payload.text, replaces: payload.replaces }
        : { kind: 'text' as const, text: payload.text }
      : { kind: payload.kind };
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
    replaces?: unknown;
  };
  if (typeof parsed?.kind === 'string' && isLoomSystemKind(parsed.kind)) {
    return { kind: parsed.kind };
  }
  if (parsed?.kind === 'text' && typeof parsed.text === 'string') {
    const replaces =
      typeof parsed.replaces === 'string' && parsed.replaces.trim()
        ? parsed.replaces
        : undefined;
    return replaces
      ? { kind: 'text', text: parsed.text, replaces }
      : { kind: 'text', text: parsed.text };
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
