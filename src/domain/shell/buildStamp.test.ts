import { describe, expect, it } from 'vitest';
import { formatBuildStamp } from './buildStamp';

describe('formatBuildStamp', () => {
  it('formats a UTC day as Last updated', () => {
    expect(formatBuildStamp('2026-10-11T19:30:00.000Z')).toBe('Last updated · 11 Oct 2026');
  });

  it('returns null for empty or invalid input', () => {
    expect(formatBuildStamp('')).toBeNull();
    expect(formatBuildStamp('not-a-date')).toBeNull();
  });
});
