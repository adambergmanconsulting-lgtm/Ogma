/**
 * Browser session for a vault: stays signed in until Log out.
 * Vault key is for retrieval (other browser / after logout), not daily unlock.
 */

const SESSION_KEY = 'ogma.vaultSession.v1';

type SessionRecord = { v: 1; vaultKey: string };

export function readVaultSessionKey(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionRecord;
    if (parsed?.v !== 1 || typeof parsed.vaultKey !== 'string' || !parsed.vaultKey) return null;
    return parsed.vaultKey;
  } catch {
    return null;
  }
}

export function writeVaultSessionKey(vaultKey: string): void {
  const rec: SessionRecord = { v: 1, vaultKey };
  localStorage.setItem(SESSION_KEY, JSON.stringify(rec));
}

export function clearVaultSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
