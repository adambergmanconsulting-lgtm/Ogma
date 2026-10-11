import { b64ToBytes, b64UrlToBytes, bytesToB64Url, toBufferSource } from '../crypto/bytes';
import { unwrapSpaceSecret } from './deviceKey';
import { openBoxPrivate } from './personBox';
import type { DeviceKeyMeta, PersonCardWire } from './types';

const HERE_WINDOW_MS = 60_000;

export type PersonMaterial = {
  personPublicB64: string;
  boxPublicB64: string;
  signKey: CryptoKey;
  boxPrivate: CryptoKey;
};

function ed25519(): AlgorithmIdentifier {
  return { name: 'Ed25519' } as AlgorithmIdentifier;
}

export function cardBytes(name: string, personPublicB64: string, boxPublicB64: string): Uint8Array {
  return new TextEncoder().encode(`${name.trim()}\n${personPublicB64}\n${boxPublicB64}`);
}

export function hereBytes(personPublicB64: string, ts: number): Uint8Array {
  return new TextEncoder().encode(`${personPublicB64}\n${ts}`);
}

async function importSignKey(pkcs8B64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'pkcs8',
    toBufferSource(b64ToBytes(pkcs8B64)),
    ed25519(),
    false,
    ['sign'],
  );
}

export async function importPersonPublic(personPublicB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toBufferSource(b64UrlToBytes(personPublicB64)),
    ed25519(),
    false,
    ['verify'],
  );
}

export async function loadPersonMaterial(
  wrapKey: CryptoKey,
  meta: DeviceKeyMeta,
): Promise<PersonMaterial | null> {
  if (!meta.personPublicB64 || !meta.personPrivateWrappedB64 || !meta.boxPublicB64 || !meta.boxPrivateWrappedB64) {
    return null;
  }
  const pkcs8B64 = await unwrapSpaceSecret(wrapKey, meta.personPrivateWrappedB64);
  return {
    personPublicB64: meta.personPublicB64,
    boxPublicB64: meta.boxPublicB64,
    signKey: await importSignKey(pkcs8B64),
    boxPrivate: await openBoxPrivate(wrapKey, meta),
  };
}

export async function signPersonCard(
  material: PersonMaterial,
  name: string,
): Promise<PersonCardWire> {
  const trimmed = name.trim();
  const sig = new Uint8Array(
    await crypto.subtle.sign(ed25519(), material.signKey, toBufferSource(cardBytes(trimmed, material.personPublicB64, material.boxPublicB64))),
  );
  return {
    name: trimmed,
    personPublicB64: material.personPublicB64,
    boxPublicB64: material.boxPublicB64,
    sigB64: bytesToB64Url(sig),
  };
}

export async function verifyPersonCard(card: PersonCardWire): Promise<boolean> {
  if (!card.name?.trim() || !card.personPublicB64 || !card.boxPublicB64 || !card.sigB64) return false;
  try {
    const pub = await importPersonPublic(card.personPublicB64);
    return crypto.subtle.verify(
      ed25519(),
      pub,
      toBufferSource(b64UrlToBytes(card.sigB64)),
      toBufferSource(cardBytes(card.name, card.personPublicB64, card.boxPublicB64)),
    );
  } catch {
    return false;
  }
}

export async function signHere(material: PersonMaterial, ts = Date.now()): Promise<{ ts: number; sigB64: string }> {
  const sig = new Uint8Array(
    await crypto.subtle.sign(ed25519(), material.signKey, toBufferSource(hereBytes(material.personPublicB64, ts))),
  );
  return { ts, sigB64: bytesToB64Url(sig) };
}

/** A signed "here" is fresh and belongs to this person id. */
export async function verifyHere(
  personPublicB64: string,
  ts: number,
  sigB64: string,
  now = Date.now(),
): Promise<boolean> {
  if (!Number.isFinite(ts) || Math.abs(now - ts) > HERE_WINDOW_MS) return false;
  try {
    const pub = await importPersonPublic(personPublicB64);
    return crypto.subtle.verify(
      ed25519(),
      pub,
      toBufferSource(b64UrlToBytes(sigB64)),
      toBufferSource(hereBytes(personPublicB64, ts)),
    );
  } catch {
    return false;
  }
}
