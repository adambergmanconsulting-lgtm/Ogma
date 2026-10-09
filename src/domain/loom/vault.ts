/**
 * Browser-profile vault (localStorage + IndexedDB on this origin).
 * Name is the display name used on Loom messages and calls.
 */

export type VaultRecord = {
  v: 1;
  displayName: string;
  createdAt: number;
  /** True when a device-key passphrase was set (meta lives in LoomStore). */
  hasDeviceKey: boolean;
};

const VAULT_KEY = 'ogma.vault.v1';

export function readVault(): VaultRecord | null {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VaultRecord;
    if (parsed?.v !== 1 || typeof parsed.displayName !== 'string' || !parsed.displayName.trim()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeVault(record: VaultRecord): void {
  localStorage.setItem(VAULT_KEY, JSON.stringify(record));
}

export function clearVault(): void {
  localStorage.removeItem(VAULT_KEY);
}

export function createVaultRecord(
  displayName: string,
  hasDeviceKey: boolean,
  createdAt = Date.now(),
): VaultRecord {
  const name = displayName.trim();
  if (!name) throw new Error('Name required');
  return { v: 1, displayName: name, createdAt, hasDeviceKey };
}

export function renameVault(displayName: string): VaultRecord {
  const current = readVault();
  if (!current) throw new Error('No vault');
  const next = { ...current, displayName: displayName.trim() };
  if (!next.displayName) throw new Error('Name required');
  writeVault(next);
  localStorage.setItem('ogma.displayName', next.displayName);
  return next;
}
