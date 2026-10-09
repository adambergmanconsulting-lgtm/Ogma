import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractRoomSecret, shareRoomLink } from './share';

describe('extractRoomSecret', () => {
  it('parses full URL with room query', () => {
    expect(extractRoomSecret('https://ogma.example/Ogma/?room=abc123def')).toBe('abc123def');
  });

  it('parses full URL with room hash', () => {
    expect(extractRoomSecret('https://ogma.example/#room=abc123def')).toBe('abc123def');
  });

  it('parses room= fragment', () => {
    expect(extractRoomSecret('room=abc123def')).toBe('abc123def');
  });

  it('parses bare id', () => {
    expect(extractRoomSecret('meetup42')).toBe('meetup42');
  });

  it('ignores space links', () => {
    expect(extractRoomSecret('https://ogma.example/#space=secret')).toBeNull();
  });

  it('rejects empty', () => {
    expect(extractRoomSecret('')).toBeNull();
  });
});

describe('shareRoomLink', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('copies to clipboard on desktop (no coarse pointer)', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      share: vi.fn(),
      clipboard: { writeText },
    });
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));

    const result = await shareRoomLink('https://example.com/?room=abc');
    expect(result).toEqual({ ok: true, method: 'clipboard' });
    expect(writeText).toHaveBeenCalledWith('https://example.com/?room=abc');
    expect(navigator.share).not.toHaveBeenCalled();
  });
});
