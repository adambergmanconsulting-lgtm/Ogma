import { openPayload } from './envelope';
import { foldTextEdits, type FoldedMessage } from './foldTextEdits';
import type { StoredMessage } from './types';

/** Open sealed rows and fold append-only text edits onto their roots. */
export async function decryptAndFoldMessages(
  secret: string,
  rows: StoredMessage[],
): Promise<FoldedMessage[]> {
  const decrypted: {
    id: string;
    author: string;
    ts: number;
    payload: Awaited<ReturnType<typeof openPayload>>;
  }[] = [];
  for (const row of rows) {
    try {
      decrypted.push({
        id: row.id,
        author: row.author,
        ts: row.ts,
        payload: await openPayload(secret, row),
      });
    } catch {
      // skip undecryptable
    }
  }
  return foldTextEdits(decrypted);
}

/** Mark self by display name for the open chat log. */
export function foldedMessagesForView(folded: FoldedMessage[], displayName: string) {
  return folded.map((m) => {
    const base = { id: m.id, author: m.author, ts: m.ts, self: m.author === displayName };
    return m.kind === 'text'
      ? { ...base, kind: 'text' as const, text: m.text, edited: m.edited }
      : { ...base, kind: m.kind };
  });
}
