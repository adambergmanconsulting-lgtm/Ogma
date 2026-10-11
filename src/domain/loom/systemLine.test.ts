import { describe, expect, it } from 'vitest';
import { isLoomSystemKind, systemLineLabel, systemLineVerb } from './systemLine';

describe('systemLine', () => {
  it('labels Call and screen events like join', () => {
    expect(systemLineLabel('Ada', 'join')).toBe('Ada joined');
    expect(systemLineLabel('Ada', 'call-start')).toBe('Ada started a call');
    expect(systemLineLabel('Ada', 'call-end')).toBe('Ada ended the call');
    expect(systemLineLabel('Ada', 'screen-share')).toBe('Ada shared a screen');
    expect(systemLineLabel('Ada', 'screen-share-end')).toBe('Ada stopped sharing');
  });

  it('recognizes system kinds', () => {
    expect(isLoomSystemKind('call-start')).toBe(true);
    expect(isLoomSystemKind('text')).toBe(false);
    expect(systemLineVerb('call-start')).toBe('started a call');
  });
});
