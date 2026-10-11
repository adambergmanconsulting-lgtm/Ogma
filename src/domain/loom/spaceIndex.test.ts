import { describe, expect, it } from 'vitest';
import { createMemoryLoomStore } from './memoryStore';
import {
  clipSpacePreview,
  displaySpaceLabel,
  formatSpaceActivity,
  mergeAuthors,
  noteSpaceAuthors,
  isFreshSoloChat,
  shortDisplayName,
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

  it('prefers custom label, then lastPreview, then Chat', () => {
    const row: SpaceIndexRow = {
      spaceId: 'abcdefghijklmnop',
      authors: ['Ada', 'Bo'],
      lastPreview: 'hello there',
      status: 'recent',
      lastOpenedAt: 0,
      lastMessageAt: 0,
      unreadCount: 0,
    };
    expect(displaySpaceLabel(row, 'Ada')).toBe('hello there');
    expect(displaySpaceLabel({ ...row, label: 'Project' }, 'Ada')).toBe('Project');
    expect(displaySpaceLabel({ ...row, lastPreview: undefined }, 'Ada')).toBe('Chat');
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

  it('uses max of message and opened', () => {
    expect(spaceActivityAt({ lastMessageAt: 5, lastOpenedAt: 9 })).toBe(9);
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
