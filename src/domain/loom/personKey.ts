import { bytesToB64, bytesToB64Url } from '../crypto/bytes';
import { wrapSpaceSecret } from './deviceKey';
import { createPersonBox } from './personBox';
import type { LoomStore } from './storePort';
import type { DeviceKeyMeta } from './types';

/**
 * Id to show beside `name`, when `name` is this vault.
 * Someone else's label gets nothing until their id is known.
 */
export function personIdForName(
  name: string,
  selfName: string,
  personId: string | null | undefined,
): string | null {
  if (!personId) return null;
  const shown = name.trim().toLowerCase();
  const self = selfName.trim().toLowerCase();
  if (!shown || !self || shown !== self) return null;
  return personId;
}

/** Short form for a hover. The full public id stays on the mark. */
export function shortPersonId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

async function createPersonKey(
  wrapKey: CryptoKey,
): Promise<Pick<DeviceKeyMeta, 'personPublicB64' | 'personPrivateWrappedB64'>> {
  const pair = (await crypto.subtle.generateKey(
    { name: 'Ed25519' } as AlgorithmIdentifier,
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair;
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  return {
    personPublicB64: bytesToB64Url(raw),
    personPrivateWrappedB64: await wrapSpaceSecret(wrapKey, bytesToB64(pkcs8)),
  };
}

/**
 * Keep a person id on the vault. Returns the existing public id, or creates one
 * and stores it with the device key. No id until a vault key can wrap it.
 */
export async function attachPersonId(
  store: Pick<LoomStore, 'setDeviceKeyMeta'>,
  wrapKey: CryptoKey,
  meta: DeviceKeyMeta,
): Promise<string> {
  let next = meta;
  let changed = false;
  if (!next.personPublicB64 || !next.personPrivateWrappedB64) {
    next = { ...next, ...(await createPersonKey(wrapKey)) };
    changed = true;
  }
  if (!next.boxPublicB64 || !next.boxPrivateWrappedB64) {
    next = { ...next, ...(await createPersonBox(wrapKey)) };
    changed = true;
  }
  if (changed) await store.setDeviceKeyMeta(next);
  return next.personPublicB64 ?? '';
}
