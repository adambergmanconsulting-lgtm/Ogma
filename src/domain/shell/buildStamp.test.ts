import { describe, expect, it } from 'vitest';
import { formatBuildStamp } from './buildStamp';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

describe('formatBuildStamp', () => {
  it('formats local wall time as Last updated (no UTC label)', () => {
    const iso = '2026-10-11T19:30:00.000Z';
    const d = new Date(iso);
    const expected = `Last updated · ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    expect(formatBuildStamp(iso)).toBe(expected);
    expect(formatBuildStamp(iso)).not.toMatch(/UTC/);
  });

  it('returns null for empty or invalid input', () => {
    expect(formatBuildStamp('')).toBeNull();
    expect(formatBuildStamp('not-a-date')).toBeNull();
  });
});
