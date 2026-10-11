import { describe, expect, it } from 'vitest';
import { createMemoryLoomStore } from './memoryStore';
import {
  chatTabLabel,
  clipSpacePreview,
  displaySpaceLabel,
  formatSpaceActivity,
  mergeAuthors,
  noteSpaceAuthors,
  isFreshSoloChat,
  shortDisplayName,
  sortSpacesRecentFirst,
  spaceActivityAt,
  spaceMatchesQuery,
  spacePeopleNames,
} from './spaceIndex';
import type { SpaceIndexRow } from './types';

describe('space labels from participants', () => {
  it('merges authors case-insensitively in first-seen order', () => {
    expect(mergeAuthors(['Ada', 'Bo'], ['ada', 'Cam', ' Bo '])).toEqual(['Ada', 'Bo', 'Cam']);
  });

  it('shortens display names to first token', () => {
    expect(shortDisplayName('Ada Lovelace')).toBe('Ada');
    expect(shortDisplayName('Bo')).toBe('Bo');
    expect(shortDisplayName('  Cam  Reed ')).toBe('Cam');
  });

  it('lists people including self', () => {
    expect(spacePeopleNames(['Bo'], 'Ada')).toEqual(['Bo', 'Ada']);
    expect(spacePeopleNames(['Ada'], 'Ada')).toEqual(['Ada']);
    expect(spacePeopleNames(undefined, 'Ada')).toEqual(['Ada']);
  });

  it('titles from other people as a,b,c; custom label wins; solo is Chat', () => {
    const row: SpaceIndexRow = {
      spaceId: 'abcdefghijklmnop',
      authors: ['Ada', 'Bo', 'Cam Reed'],
      lastPreview: 'hello there',
      status: 'recent',
      lastOpenedAt: 0,
      lastMessageAt: 0,
      unreadCount: 0,
    };
    expect(displaySpaceLabel(row, 'Ada')).toBe('Bo,Cam');
    expect(displaySpaceLabel(row, 'Bo')).toBe('Ada,Cam');
    expect(displaySpaceLabel({ ...row, label: 'Project' }, 'Ada')).toBe('Project');
    expect(
      displaySpaceLabel({ ...row, authors: ['Ada'], lastPreview: undefined }, 'Ada'),
    ).toBe('Chat');
    expect(chatTabLabel(row, 'Ada')).toBe('Bo,Cam');
    expect(chatTabLabel({ ...row, authors: ['Ada'] }, 'Ada')).toBe('This chat');
    expect(chatTabLabel(null, 'Ada')).toBe('This chat');
  });

  it('clips long previews', () => {
    expect(clipSpacePreview('a'.repeat(100)).length).toBeLessThanOrEqual(80);
    expect(clipSpacePreview('a'.repeat(100)).endsWith('…')).toBe(true);
  });

  it('detects a fresh solo chat (no others, no text)', () => {
    expect(isFreshSoloChat(['Ada'], 'Ada', false)).toBe(true);
    expect(isFreshSoloChat([], 'Ada', false)).toBe(true);
    expect(isFreshSoloChat(['Ada'], 'Ada', true)).toBe(false);
    expect(isFreshSoloChat(['Ada', 'Bo'], 'Ada', false)).toBe(false);
  });

  it('matches Spaces search against label, preview, and authors', () => {
    const row: SpaceIndexRow = {
      spaceId: 'abcdefghijklmnop',
      authors: ['Ada Lovelace', 'Bo'],
      lastPreview: 'shipping notes',
      status: 'recent',
      lastOpenedAt: 0,
      lastMessageAt: 0,
      unreadCount: 0,
    };
    expect(spaceMatchesQuery(row, '')).toBe(true);
    expect(spaceMatchesQuery(row, 'ship')).toBe(true);
    expect(spaceMatchesQuery(row, 'lovelace')).toBe(true);
    expect(spaceMatchesQuery({ ...row, label: 'Project X' }, 'project')).toBe(true);
    expect(spaceMatchesQuery(row, 'zzz')).toBe(false);
  });

  it('persists newly seen authors on the space row', async () => {
    const store = createMemoryLoomStore();
    const row: SpaceIndexRow = {
      spaceId: 's1',
      status: 'recent',
      lastOpenedAt: 1,
      lastMessageAt: 1,
      unreadCount: 0,
    };
    await store.putSpace(row);
    const next = await noteSpaceAuthors(store, 's1', ['Ada', 'Bo']);
    expect(next?.authors).toEqual(['Ada', 'Bo']);
    expect((await store.getSpace('s1'))?.authors).toEqual(['Ada', 'Bo']);
  });
});

describe('formatSpaceActivity', () => {
  const locale = 'en-US';
  const now = new Date(2026, 9, 10, 15, 30, 0).getTime(); // 10 Oct 2026 15:30

  it('uses max of text and Call times (not opens or joins)', () => {
    expect(spaceActivityAt({ lastMessageAt: 5, lastCallAt: 9 })).toBe(9);
    expect(spaceActivityAt({ lastMessageAt: 5, lastCallAt: 2 })).toBe(5);
    expect(spaceActivityAt({ lastMessageAt: 0, lastCallAt: 0 })).toBe(0);
  });

  it('sorts All by text/Call activity ahead of join-only rows', () => {
    const joinOnly: SpaceIndexRow = {
      spaceId: 'join',
      authors: ['Ada', 'Bo'],
      lastPreview: 'Bo joined',
      status: 'recent',
      lastOpenedAt: 100,
      lastMessageAt: 0,
      unreadCount: 0,
    };
    const withText: SpaceIndexRow = {
      spaceId: 'text',
      authors: ['Ada'],
      lastPreview: 'hi',
      status: 'recent',
      lastOpenedAt: 1,
      lastMessageAt: 50,
      unreadCount: 0,
    };
    const withCall: SpaceIndexRow = {
      spaceId: 'call',
      authors: ['Ada'],
      status: 'recent',
      lastOpenedAt: 1,
      lastMessageAt: 0,
      lastCallAt: 80,
      unreadCount: 0,
    };
    expect(sortSpacesRecentFirst([joinOnly, withText, withCall]).map((r) => r.spaceId)).toEqual([
      'call',
      'text',
      'join',
    ]);
  });

  it('shows time for today', () => {
    const at = new Date(2026, 9, 10, 9, 5, 0).getTime();
    expect(formatSpaceActivity(at, now, locale)).toMatch(/9:05/);
  });

  it('shows Yesterday', () => {
    const at = new Date(2026, 9, 9, 12, 0, 0).getTime();
    expect(formatSpaceActivity(at, now, locale)).toBe('Yesterday');
  });

  it('shows month day same year', () => {
    const at = new Date(2026, 8, 1, 12, 0, 0).getTime();
    expect(formatSpaceActivity(at, now, locale)).toBe('Sep 1');
  });
});
