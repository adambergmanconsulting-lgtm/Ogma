import { describe, expect, it } from 'vitest';
import {
  createRoomSecret,
  parseCapabilityFromHash,
  parseRoomIdFromHash,
  roomHash,
  spaceHash,
} from './room';

describe('parseCapabilityFromHash', () => {
  it('reads room=', () => {
    expect(parseCapabilityFromHash('#room=golden-thread')).toEqual({
      kind: 'room',
      secret: 'golden-thread',
    });
  });

  it('reads space=', () => {
    expect(parseCapabilityFromHash('#space=team-secret')).toEqual({
      kind: 'space',
      secret: 'team-secret',
    });
  });

  it('reads legacy bare id as room', () => {
    expect(parseRoomIdFromHash('#meetup42')).toBe('meetup42');
  });

  it('rejects empty', () => {
    expect(parseCapabilityFromHash('#')).toBeNull();
  });
});

describe('hashes', () => {
  it('encodes room and space', () => {
    expect(roomHash('a b')).toBe('#room=a%20b');
    expect(spaceHash('x')).toBe('#space=x');
  });
});

describe('createRoomSecret', () => {
  it('returns url-safe entropy', () => {
    const s = createRoomSecret();
    expect(s.length).toBeGreaterThanOrEqual(16);
    expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
