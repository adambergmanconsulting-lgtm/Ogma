import { b64ToBytes, b64UrlToBytes, bytesToB64, bytesToB64Url, toBufferSource } from '../crypto/bytes';
import { unwrapSpaceSecret, wrapSpaceSecret } from './deviceKey';
import type { DeviceKeyMeta } from './types';

const BOX_INFO = 'ogma-person-box-v1';

export type PersonBoxPublic = {
  boxPublicB64: string;
  boxPrivateWrappedB64: string;
};

/** Encryption key for invites. The person id stays the Ed25519 public key. */
export async function createPersonBox(wrapKey: CryptoKey): Promise<PersonBoxPublic> {
  const pair = (await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  )) as CryptoKeyPair;
  const spki = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey));
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  return {
    boxPublicB64: bytesToB64Url(spki),
    boxPrivateWrappedB64: await wrapSpaceSecret(wrapKey, bytesToB64(pkcs8)),
  };
}

export async function importBoxPublic(boxPublicB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'spki',
    toBufferSource(b64UrlToBytes(boxPublicB64)),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );
}

export async function openBoxPrivate(wrapKey: CryptoKey, meta: DeviceKeyMeta): Promise<CryptoKey> {
  if (!meta.boxPrivateWrappedB64) throw new Error('No box key');
  const pkcs8B64 = await unwrapSpaceSecret(wrapKey, meta.boxPrivateWrappedB64);
  return crypto.subtle.importKey(
    'pkcs8',
    toBufferSource(b64ToBytes(pkcs8B64)),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveBits'],
  );
}

async function aesFromShared(shared: ArrayBuffer, usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', shared, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: toBufferSource(new Uint8Array(0)),
      info: toBufferSource(new TextEncoder().encode(BOX_INFO)),
    },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage],
  );
}

/** Seal a space secret so only `boxPublicB64` can open it. */
export async function sealForPerson(boxPublicB64: string, plaintext: string): Promise<string> {
  const theirPub = await importBoxPublic(boxPublicB64);
  const eph = (await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  )) as CryptoKeyPair;
  const shared = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: theirPub },
    eph.privateKey,
    256,
  );
  const aes = await aesFromShared(shared, 'encrypt');
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: toBufferSource(nonce) },
      aes,
      toBufferSource(new TextEncoder().encode(plaintext)),
    ),
  );
  const ephem = new Uint8Array(await crypto.subtle.exportKey('spki', eph.publicKey));
  const packed = new Uint8Array(2 + ephem.length + nonce.length + cipher.length);
  packed[0] = ephem.length >> 8;
  packed[1] = ephem.length & 0xff;
  packed.set(ephem, 2);
  packed.set(nonce, 2 + ephem.length);
  packed.set(cipher, 2 + ephem.length + nonce.length);
  return bytesToB64Url(packed);
}

export async function openSealedForPerson(boxPrivate: CryptoKey, sealedB64: string): Promise<string> {
  const packed = b64UrlToBytes(sealedB64);
  if (packed.length < 2 + 12 + 1) throw new Error('Invalid invite');
  const ephemLen = (packed[0] << 8) | packed[1];
  if (packed.length < 2 + ephemLen + 12 + 1) throw new Error('Invalid invite');
  const ephem = packed.slice(2, 2 + ephemLen);
  const nonce = packed.slice(2 + ephemLen, 2 + ephemLen + 12);
  const cipher = packed.slice(2 + ephemLen + 12);
  const ephPub = await crypto.subtle.importKey(
    'spki',
    toBufferSource(ephem),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );
  const shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: ephPub }, boxPrivate, 256);
  const aes = await aesFromShared(shared, 'decrypt');
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toBufferSource(nonce) },
    aes,
    toBufferSource(cipher),
  );
  return new TextDecoder().decode(plain);
}
