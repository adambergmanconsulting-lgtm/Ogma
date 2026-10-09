import { describe, expect, it } from 'vitest';
import type { SpaceIndexRow } from './types';
import { pickWarmSpaceIds } from './warm';

function row(partial: Partial<SpaceIndexRow> & { spaceId: string }): SpaceIndexRow {
  return {
    status: 'recent',
    lastOpenedAt: 0,
    lastMessageAt: 0,
    unreadCount: 0,
    ...partial,
  };
}

describe('pickWarmSpaceIds', () => {
  it('caps at 3 and prefers focused + recent with secrets', () => {
    const rows = [
      row({ spaceId: 'a', lastMessageAt: 3 }),
      row({ spaceId: 'b', lastMessageAt: 2 }),
      row({ spaceId: 'c', lastMessageAt: 1 }),
      row({ spaceId: 'd', lastMessageAt: 4 }),
    ];
    const secrets = new Set(['a', 'b', 'c', 'focused']);
    const warm = pickWarmSpaceIds(rows, {
      focusedSpaceId: 'focused',
      hasSecret: (id) => secrets.has(id),
    });
    expect(warm).toEqual(['focused', 'a', 'b']);
  });

  it('skips spaces without secrets', () => {
    const rows = [row({ spaceId: 'cold', lastMessageAt: 9 }), row({ spaceId: 'hot', lastMessageAt: 1 })];
    expect(
      pickWarmSpaceIds(rows, {
        hasSecret: (id) => id === 'hot',
      }),
    ).toEqual(['hot']);
  });
});
