import { describe, expect, it } from 'vitest';
import { splitMessageLinks } from './messageLinks';

describe('splitMessageLinks', () => {
  it('returns plain text unchanged', () => {
    expect(splitMessageLinks('hello there')).toEqual([{ kind: 'text', text: 'hello there' }]);
  });

  it('linkifies https URLs and shortens the label', () => {
    const parts = splitMessageLinks('see https://example.com/docs/guide please');
    expect(parts).toEqual([
      { kind: 'text', text: 'see ' },
      {
        kind: 'link',
        href: 'https://example.com/docs/guide',
        label: 'example.com/docs/guide',
        title: 'https://example.com/docs/guide',
        external: true,
      },
      { kind: 'text', text: ' please' },
    ]);
  });

  it('strips trailing sentence punctuation from the href', () => {
    const parts = splitMessageLinks('go https://example.com/a.');
    expect(parts[1]).toMatchObject({
      kind: 'link',
      href: 'https://example.com/a',
    });
    expect(parts[2]).toEqual({ kind: 'text', text: '.' });
  });

  it('labels same-origin room invites without dumping the secret', () => {
    const href = 'https://app.example/Ogma/?room=abcdefghijklmnop';
    const parts = splitMessageLinks(`join ${href}`, 'https://app.example');
    expect(parts[1]).toEqual({
      kind: 'link',
      href,
      label: 'Invite link (abcd…mnop)',
      title: href,
      external: false,
    });
  });

  it('labels space hash invites and marks other origins external', () => {
    const href = 'https://other.example/#space=secretvalue12';
    const parts = splitMessageLinks(href, 'https://app.example');
    expect(parts[0]).toEqual({
      kind: 'link',
      href,
      label: 'Invite link (secr…ue12)',
      title: href,
      external: true,
    });
  });

  it('keeps surrounding newlines and multiple links', () => {
    const parts = splitMessageLinks('a\nhttps://a.test/x\nb\nhttps://b.test/y');
    expect(parts.map((p) => p.kind)).toEqual(['text', 'link', 'text', 'link']);
    expect(parts[0]).toEqual({ kind: 'text', text: 'a\n' });
    expect(parts[2]).toEqual({ kind: 'text', text: '\nb\n' });
  });
});
