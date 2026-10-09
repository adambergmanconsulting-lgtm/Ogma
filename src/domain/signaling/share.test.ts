import { describe, expect, it } from 'vitest';
import { extractRoomSecret } from './share';

describe('extractRoomSecret', () => {
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
