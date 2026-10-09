/** Web Crypto seal/open for Loom (and reusable helpers). Spec: docs/engineering/protocols/loom-sync.md */

const INFO_ENC = 'ogma-loom-enc-v1';

function toBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

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

export async function sealText(
  spaceSecret: string,
  text: string,
): Promise<{
  nonce: string;
  ciphertext: string;
}> {
  const key = await deriveEncKey(spaceSecret);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify({ text }));
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

export async function openText(
  spaceSecret: string,
  nonceB64: string,
  ciphertextB64: string,
): Promise<string> {
  const key = await deriveEncKey(spaceSecret);
  const nonce = b64ToBytes(nonceB64);
  const ciphertext = b64ToBytes(ciphertextB64);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toBufferSource(nonce) },
    key,
    toBufferSource(ciphertext),
  );
  const parsed = JSON.parse(new TextDecoder().decode(plain)) as { text?: string };
  if (typeof parsed.text !== 'string') {
    throw new Error('Invalid payload');
  }
  return parsed.text;
}

function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
