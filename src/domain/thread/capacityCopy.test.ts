import { describe, expect, it } from 'vitest';
import { capacityWarningLabel, roomFullLabel } from './capacityCopy';

describe('capacityCopy', () => {
  it('warns at soft threshold with locked shape', () => {
    expect(capacityWarningLabel(4, 6, 5)).toBeNull();
    expect(capacityWarningLabel(5, 6, 5)).toBe('5 of 6 — quality may drop');
    expect(capacityWarningLabel(6, 6, 5)).toBe('6 of 6 — quality may drop');
  });

  it('room full stays short', () => {
    expect(roomFullLabel(6)).toBe('Room full (6 max)');
  });
});
