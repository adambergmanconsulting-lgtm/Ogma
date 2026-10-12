import { describe, expect, it } from 'vitest';
import {
  CHAT_SOUND_STORAGE_KEY,
  readChatSoundEnabled,
  writeChatSoundEnabled,
} from './chatSoundSettings';

function memoryStorage(seed: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(seed));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => {
      map.delete(k);
    },
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

describe('chatSoundSettings', () => {
  it('defaults to on when unset', () => {
    expect(readChatSoundEnabled(memoryStorage())).toBe(true);
  });

  it('treats 0 as off and 1 as on', () => {
    const storage = memoryStorage();
    writeChatSoundEnabled(false, storage);
    expect(storage.getItem(CHAT_SOUND_STORAGE_KEY)).toBe('0');
    expect(readChatSoundEnabled(storage)).toBe(false);
    writeChatSoundEnabled(true, storage);
    expect(storage.getItem(CHAT_SOUND_STORAGE_KEY)).toBe('1');
    expect(readChatSoundEnabled(storage)).toBe(true);
  });
});
