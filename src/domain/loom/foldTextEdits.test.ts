import { describe, expect, it } from 'vitest';
import { foldTextEdits, type FoldableMessage } from './foldTextEdits';

function text(
  id: string,
  author: string,
  ts: number,
  body: string,
  replaces?: string,
): FoldableMessage {
  return {
    id,
    author,
    ts,
    payload: replaces
      ? { kind: 'text', text: body, replaces }
      : { kind: 'text', text: body },
  };
}

describe('foldTextEdits', () => {
  it('applies the newest author-matching edit onto the root', () => {
    const folded = foldTextEdits([
      { id: 'j', author: 'Ada', ts: 0, payload: { kind: 'join' } },
      text('a', 'Ada', 1, 'one'),
      text('b', 'Ada', 2, 'two', 'a'),
      text('c', 'Ada', 3, 'three', 'a'),
    ]);
    expect(folded).toEqual([
      { id: 'j', author: 'Ada', ts: 0, kind: 'join' },
      { id: 'a', author: 'Ada', ts: 1, kind: 'text', text: 'three', edited: true },
    ]);
  });

  it('ignores edits from a different author', () => {
    const folded = foldTextEdits([
      text('a', 'Ada', 1, 'mine'),
      text('b', 'Bo', 2, 'hijack', 'a'),
    ]);
    expect(folded).toEqual([
      { id: 'a', author: 'Ada', ts: 1, kind: 'text', text: 'mine' },
      { id: 'b', author: 'Bo', ts: 2, kind: 'text', text: 'hijack' },
    ]);
  });

  it('shows orphan edits as their own text bubble', () => {
    const folded = foldTextEdits([text('e', 'Ada', 5, 'late', 'missing')]);
    expect(folded).toEqual([
      { id: 'e', author: 'Ada', ts: 5, kind: 'text', text: 'late' },
    ]);
  });

  it('leaves unedited text alone', () => {
    expect(foldTextEdits([text('a', 'Ada', 1, 'hi')])).toEqual([
      { id: 'a', author: 'Ada', ts: 1, kind: 'text', text: 'hi' },
    ]);
  });
});
