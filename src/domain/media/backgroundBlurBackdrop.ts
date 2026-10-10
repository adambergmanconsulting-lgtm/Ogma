/** Built-in soft fills for privacy blur (local only; no upload). */

export type PrivacyBackdropId = 'soft' | 'cool' | 'warm';

export type PrivacyBackdropColors = {
  top: string;
  mid: string;
  bottom: string;
};

export type PrivacyBackdropOption = {
  id: PrivacyBackdropId;
  /** Short Devices label (ui-naming: Soft / Cool / Warm). */
  label: string;
  colors: PrivacyBackdropColors;
};

const STORAGE_KEY = 'ogma.privacyBackdrop';

export const PRIVACY_BACKDROPS: readonly PrivacyBackdropOption[] = [
  {
    id: 'soft',
    label: 'Soft',
    colors: { top: '#1e293b', mid: '#152033', bottom: '#0f172a' },
  },
  {
    id: 'cool',
    label: 'Cool',
    colors: { top: '#1e3a5f', mid: '#122a45', bottom: '#0b1a2e' },
  },
  {
    id: 'warm',
    label: 'Warm',
    colors: { top: '#2a241c', mid: '#1f1a14', bottom: '#14100c' },
  },
] as const;

export const DEFAULT_PRIVACY_BACKDROP: PrivacyBackdropId = 'soft';

export function parsePrivacyBackdropId(raw: unknown): PrivacyBackdropId {
  if (raw === 'soft' || raw === 'cool' || raw === 'warm') return raw;
  return DEFAULT_PRIVACY_BACKDROP;
}

export function privacyBackdropColors(id: PrivacyBackdropId): PrivacyBackdropColors {
  const hit = PRIVACY_BACKDROPS.find((b) => b.id === id);
  return hit?.colors ?? PRIVACY_BACKDROPS[0]!.colors;
}

export function loadPrivacyBackdropId(): PrivacyBackdropId {
  try {
    return parsePrivacyBackdropId(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_PRIVACY_BACKDROP;
  }
}

export function savePrivacyBackdropId(id: PrivacyBackdropId): void {
  try {
    localStorage.setItem(STORAGE_KEY, parsePrivacyBackdropId(id));
  } catch {
    // Quota / private mode — preference is best-effort.
  }
}
