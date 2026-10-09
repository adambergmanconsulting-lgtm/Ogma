import { describe, expect, it, vi } from 'vitest';
import {
  createRoomSecret,
  parseCapabilityFromHash,
  parseRoomIdFromHash,
  parseRoomIdFromLocation,
  roomDisplayCode,
  roomHash,
  roomShareUrl,
  parseSpaceSecretFromLocation,
  spaceHash,
  spaceShareUrl,
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

describe('parseRoomIdFromLocation', () => {
  it('prefers query over hash', () => {
    expect(
      parseRoomIdFromLocation({ search: '?room=from-query', hash: '#room=from-hash' }),
    ).toBe('from-query');
  });

  it('falls back to hash', () => {
    expect(parseRoomIdFromLocation({ search: '', hash: '#room=legacy' })).toBe('legacy');
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

describe('roomDisplayCode', () => {
  it('shows a short uppercase prefix', () => {
    expect(roomDisplayCode('7Di9LHXvokdxZKx5P3gYTA')).toBe('7DI9LH');
  });
});

describe('roomShareUrl', () => {
  it('uses query room= and keeps an http(s) origin', () => {
    vi.stubGlobal('location', { origin: 'https://host.example' });
    const href = roomShareUrl('AbCdEf123456');
    expect(href).toContain('?room=AbCdEf123456');
    expect(href).not.toContain('#room=');
    expect(href.startsWith('http')).toBe(true);
  });

  it('adds #space= when the call is bound to a chat', () => {
    vi.stubGlobal('location', { origin: 'https://host.example' });
    const href = roomShareUrl('AbCdEf123456', { spaceSecret: 'space-sec' });
    expect(href).toContain('?room=AbCdEf123456');
    expect(href).toContain('#space=space-sec');
  });
});

describe('space location', () => {
  it('reads space from hash or query', () => {
    expect(parseSpaceSecretFromLocation({ search: '', hash: '#space=abc' })).toBe('abc');
    expect(parseSpaceSecretFromLocation({ search: '?space=from-q', hash: '' })).toBe('from-q');
  });

  it('builds space share url with hash', () => {
    vi.stubGlobal('location', { origin: 'https://host.example' });
    expect(spaceShareUrl('sec')).toContain('#space=sec');
  });
});
