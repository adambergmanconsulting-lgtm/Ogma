/**
 * Cold name profile + optional vault-key install (deferred until New / Settings).
 * Keeps erase + key crypto out of useLoomController size budget.
 */
import {
  createDeviceKeyMeta,
  loadRememberedSecrets,
  unlockDeviceKey,
} from '../domain/loom/deviceKey';
import { eraseLocalVaultData } from '../domain/loom/eraseLocalVault';
import { attachPersonId } from '../domain/loom/personKey';
import {
  hydrateLocalSecrets,
  wrapStoredSpaceSecrets,
} from '../domain/loom/spaceSecretAccess';
import type { SpaceIndexRow } from '../domain/loom/types';
import type { LoomStore } from '../domain/loom/storePort';
import {
  createVaultRecord,
  writeVault,
  type VaultRecord,
} from '../domain/loom/vault';
import { generateVaultKey } from '../domain/loom/vaultKey';
import { writeVaultSessionKey } from '../domain/loom/vaultSession';
import { clearCapabilityFromUrl } from '../domain/signaling/room';

/** Name-only profile: Join / Call from invite without a vault key. */
export async function bootstrapNameOnlyVault(
  store: LoomStore,
  name: string,
): Promise<VaultRecord> {
  await eraseLocalVaultData(store);
  clearCapabilityFromUrl();
  const rec = createVaultRecord(name, false);
  writeVault(rec);
  localStorage.setItem('ogma.displayName', name.trim());
  return rec;
}

export type InstalledVaultKey = {
  vaultKey: string;
  wrapKey: CryptoKey;
  personId: string;
  vault: VaultRecord;
  why: string;
};

/** Create device key, wrap remembered spaces, reveal once. */
export async function installVaultKey(
  store: LoomStore,
  vault: VaultRecord,
  secrets: Map<string, string>,
  why: string,
): Promise<InstalledVaultKey> {
  const vaultKey = generateVaultKey();
  const meta = await createDeviceKeyMeta(vaultKey);
  await store.setDeviceKeyMeta(meta);
  const wrapKey = await unlockDeviceKey(vaultKey, meta);
  const personId = await attachPersonId(store, wrapKey, meta);
  writeVaultSessionKey(vaultKey);
  const next = { ...vault, hasDeviceKey: true };
  writeVault(next);
  await wrapStoredSpaceSecrets(wrapKey, store, await store.listSpaces(), secrets);
  return { vaultKey, wrapKey, personId, vault: next, why };
}

export const VAULT_KEY_WHY_NEW =
  'Save this vault key to open this vault later (after Log out, or to confirm you have it). You stay signed in here until you log out. Ogma cannot recover the key.';

export const VAULT_KEY_WHY_SETTINGS =
  'Save this vault key to retrieve your chats later (new browser, or after Log out). You stay signed in here until you log out. Ogma cannot recover the key.';

/** Unlock existing device key; hydrate + wrap space secrets. */
export async function unlockExistingVaultKey(
  store: LoomStore,
  vaultKey: string,
  secrets: Map<string, string>,
  persistSession: boolean,
): Promise<{ wrapKey: CryptoKey; personId: string; rows: SpaceIndexRow[] }> {
  const meta = await store.getDeviceKeyMeta();
  if (!meta) throw new Error('No vault key on this browser');
  const wrapKey = await unlockDeviceKey(vaultKey, meta);
  const personId = await attachPersonId(store, wrapKey, meta);
  const rows = await store.listSpaces();
  hydrateLocalSecrets(rows, secrets);
  await loadRememberedSecrets(wrapKey, rows, secrets);
  await wrapStoredSpaceSecrets(wrapKey, store, await store.listSpaces(), secrets);
  if (persistSession) writeVaultSessionKey(vaultKey);
  return { wrapKey, personId, rows };
}
