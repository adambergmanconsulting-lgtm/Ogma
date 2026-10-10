import { useCallback, useState } from 'react';
import { readStoredTurnUri, writeStoredTurnUri } from '../domain/thread/iceConfig';

/** Optional user TURN URI for Settings → Network help. */
export function useTurnSettings() {
  const [turnUri, setTurnUri] = useState(() => readStoredTurnUri());
  const [turnError, setTurnError] = useState<string | null>(null);

  const saveTurnUri = useCallback((uri: string) => {
    const result = writeStoredTurnUri(uri);
    if (!result.ok) {
      setTurnError('Use a turn: or turns: URI (optional username:password@host).');
      return;
    }
    setTurnUri(readStoredTurnUri());
    setTurnError(null);
  }, []);

  const clearTurnError = useCallback(() => setTurnError(null), []);

  return { turnUri, turnError, saveTurnUri, clearTurnError };
}
