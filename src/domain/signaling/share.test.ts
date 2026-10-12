import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractInviteSecrets, extractRoomSecret, shareRoomLink } from './share';

describe('extractInviteSecrets', () => {
  it('parses Call-from-chat URL (room + space)', () => {
    expect(
      extractInviteSecrets('https://ogma.example/Ogma/?room=roomSecret&space=spaceSecret#space=spaceSecret'),
    ).toEqual({ room: 'roomSecret', space: 'spaceSecret' });
  });

  it('parses room-only share URL', () => {
    expect(extractInviteSecrets('https://ogma.example/?room=abc123def')).toEqual({
      room: 'abc123def',
      space: null,
    });
  });

  it('parses space-only share URL', () => {
    expect(extractInviteSecrets('https://ogma.example/?space=sec123#space=sec123')).toEqual({
      room: null,
      space: 'sec123',
    });
  });

  it('treats bare id as space (home Join)', () => {
    expect(extractInviteSecrets('meetup42')).toEqual({ room: null, space: 'meetup42' });
  });

  it('rejects empty', () => {
    expect(extractInviteSecrets('')).toEqual({ room: null, space: null });
  });
});

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
