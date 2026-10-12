import type { LoomSealPayload } from '../crypto/seal';

/** Decrypted log row before UI fold. */
export type FoldableMessage = {
  id: string;
  author: string;
  ts: number;
  payload: LoomSealPayload;
};

function newerRow(a: FoldableMessage, b: FoldableMessage): boolean {
  if (a.ts !== b.ts) return a.ts > b.ts;
  return a.id > b.id;
}

/** Display row after edits are folded onto their root. */
export type FoldedMessage = {
  id: string;
  author: string;
  ts: number;
} & (
  | { kind: 'text'; text: string; edited?: boolean }
  | { kind: Exclude<LoomSealPayload['kind'], 'text'> }
);

/**
 * Collapse append-only text edits onto their root bubble.
 * Edits apply only when author matches the root; orphans show as their own text.
 */
export function foldTextEdits(rows: FoldableMessage[]): FoldedMessage[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  /** rootId → winning edit row (newest author-matching). */
  const winnerByRoot = new Map<string, FoldableMessage>();

  for (const row of rows) {
    if (row.payload.kind !== 'text' || !row.payload.replaces) continue;
    const rootId = row.payload.replaces;
    const root = byId.get(rootId);
    if (!root || root.payload.kind !== 'text' || root.payload.replaces) continue;
    if (row.author !== root.author) continue;
    const prev = winnerByRoot.get(rootId);
    if (!prev || newerRow(row, prev)) {
      winnerByRoot.set(rootId, row);
    }
  }

  const hidden = new Set<string>();
  for (const [rootId, edit] of winnerByRoot) {
    hidden.add(edit.id);
    // Hide non-winning edits that also target this root (same author).
    for (const row of rows) {
      if (row.id === edit.id) continue;
      if (row.payload.kind !== 'text' || row.payload.replaces !== rootId) continue;
      if (row.author !== edit.author) continue;
      hidden.add(row.id);
    }
  }

  const out: FoldedMessage[] = [];
  for (const row of rows) {
    if (hidden.has(row.id)) continue;
    if (row.payload.kind !== 'text') {
      out.push({ id: row.id, author: row.author, ts: row.ts, kind: row.payload.kind });
      continue;
    }
    if (row.payload.replaces) {
      // Orphan edit (no matching root) — show as normal text.
      out.push({
        id: row.id,
        author: row.author,
        ts: row.ts,
        kind: 'text',
        text: row.payload.text,
      });
      continue;
    }
    const winner = winnerByRoot.get(row.id);
    if (winner && winner.payload.kind === 'text') {
      out.push({
        id: row.id,
        author: row.author,
        ts: row.ts,
        kind: 'text',
        text: winner.payload.text,
        edited: true,
      });
    } else {
      out.push({
        id: row.id,
        author: row.author,
        ts: row.ts,
        kind: 'text',
        text: row.payload.text,
      });
    }
  }
  return out;
}
