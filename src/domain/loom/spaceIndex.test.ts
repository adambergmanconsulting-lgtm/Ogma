import { describe, expect, it } from 'vitest';
import { createMemoryLoomStore } from './memoryStore';
import {
  displaySpaceLabel,
  formatParticipantLabel,
  formatSpaceActivity,
  mergeAuthors,
  noteSpaceAuthors,
  spaceActivityAt,
} from './spaceIndex';
import type { SpaceIndexRow } from './types';

describe('space labels from participants', () => {
  it('merges authors case-insensitively in first-seen order', () => {
    expect(mergeAuthors(['Ada', 'Bo'], ['ada', 'Cam', ' Bo '])).toEqual(['Ada', 'Bo', 'Cam']);
  });

  it('formats others and excludes self', () => {
    expect(formatParticipantLabel(['Ada', 'Bo'], 'Ada')).toBe('Bo');
    expect(formatParticipantLabel(['Ada', 'Bo', 'Cam'], 'Ada')).toBe('Bo, Cam');
    expect(formatParticipantLabel(['Ada', 'Bo', 'Cam', 'Dee', 'Ed'], 'Ada')).toBe('Bo, Cam +2');
    expect(formatParticipantLabel(['Ada'], 'Ada')).toBeNull();
  });

  it('prefers custom label, then participants, then Only you', () => {
    const row: SpaceIndexRow = {
      spaceId: 'abcdefghijklmnop',
      authors: ['Ada', 'Bo'],
      status: 'recent',
      lastOpenedAt: 0,
      lastMessageAt: 0,
      unreadCount: 0,
    };
    expect(displaySpaceLabel(row, 'Ada')).toBe('Bo');
    expect(displaySpaceLabel({ ...row, label: 'Project' }, 'Ada')).toBe('Project');
    expect(displaySpaceLabel({ ...row, authors: ['Ada'] }, 'Ada')).toBe('Only you');
    expect(displaySpaceLabel({ ...row, authors: undefined }, 'Ada')).toBe('Only you');
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
