import { describe, expect, it } from 'vitest';
import { formatMessageTime } from './formatMessageTime';

describe('formatMessageTime', () => {
  const locale = 'en-US';
  const now = new Date(2026, 9, 10, 15, 30, 0).getTime(); // 10 Oct 2026 15:30

  it('shows time for today', () => {
    const at = new Date(2026, 9, 10, 9, 5, 0).getTime();
    expect(formatMessageTime(at, now, locale)).toMatch(/9:05/);
  });

  it('shows date and time for earlier this year', () => {
    const at = new Date(2026, 8, 1, 9, 5, 0).getTime();
    expect(formatMessageTime(at, now, locale)).toMatch(/Sep 1/);
    expect(formatMessageTime(at, now, locale)).toMatch(/9:05/);
  });

  it('includes year when not this year', () => {
    const at = new Date(2025, 8, 1, 9, 5, 0).getTime();
    expect(formatMessageTime(at, now, locale)).toMatch(/2025/);
    expect(formatMessageTime(at, now, locale)).toMatch(/9:05/);
  });

  it('returns empty for missing time', () => {
    expect(formatMessageTime(0, now, locale)).toBe('');
  });
});
