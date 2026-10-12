/** Chat alert sound preference (Settings → Alerts). Default on. */

export const CHAT_SOUND_STORAGE_KEY = 'ogma.chatSound';

export const ALERT_SETTINGS = {
  summary: 'Alerts',
  heading: 'Alerts',
  chatSoundLabel: 'Chat sounds',
  chatSoundBody:
    'Short chime when a warm chat gets mail while you are in another chat or the tab is in the background.',
  callRingBody: 'Incoming Call also rings in this tab until you Accept or Not now.',
} as const;

/** Absent or anything other than `0` → enabled (default on). */
export function readChatSoundEnabled(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage !== 'undefined'
    ? localStorage
    : null,
): boolean {
  if (!storage) return true;
  try {
    return storage.getItem(CHAT_SOUND_STORAGE_KEY) !== '0';
  } catch {
    return true;
  }
}

export function writeChatSoundEnabled(
  enabled: boolean,
  storage: Pick<Storage, 'setItem'> | null = typeof localStorage !== 'undefined'
    ? localStorage
    : null,
): void {
  if (!storage) return;
  try {
    storage.setItem(CHAT_SOUND_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // ignore quota / private mode
  }
}
