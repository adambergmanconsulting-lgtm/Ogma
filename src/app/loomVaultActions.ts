import { downloadBackup, importBackup, parseBackupJson } from '../domain/loom/exportImport';
import type { LoomStore } from '../domain/loom/storePort';
import { getLoomStore } from '../domain/loom/store';
import { clearVault, renameVault, type VaultRecord } from '../domain/loom/vault';

export async function exportVaultFile(store: LoomStore | null): Promise<void> {
  await downloadBackup(store ?? (await getLoomStore()));
}

export async function importVaultFile(store: LoomStore | null, file: File): Promise<void> {
  const s = store ?? (await getLoomStore());
  await importBackup(s, parseBackupJson(await file.text()));
}

export function applyVaultRename(name: string): VaultRecord {
  return renameVault(name);
}

export function clearLocalVaultRecord(): void {
  clearVault();
}
