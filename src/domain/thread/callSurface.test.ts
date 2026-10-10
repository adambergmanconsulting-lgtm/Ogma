import { describe, expect, it } from 'vitest';
import { resolveCallSurface } from './callSurface';

describe('resolveCallSurface', () => {
  it('is none when not in call', () => {
    expect(
      resolveCallSurface({
        inCall: false,
        boundSpaceSecret: 's',
        focusedSecret: 's',
        screen: 'space',
        roomShellOpen: true,
      }),
    ).toBe('none');
  });

  it('shows space-call when focused on the bound space', () => {
    expect(
      resolveCallSurface({
        inCall: true,
        boundSpaceSecret: 's',
        focusedSecret: 's',
        screen: 'space',
        roomShellOpen: false,
      }),
    ).toBe('space-call');
  });

  it('backgrounds when home or another space while bound call lives', () => {
    expect(
      resolveCallSurface({
        inCall: true,
        boundSpaceSecret: 's',
        focusedSecret: null,
        screen: 'home',
        roomShellOpen: false,
      }),
    ).toBe('background');
    expect(
      resolveCallSurface({
        inCall: true,
        boundSpaceSecret: 's',
        focusedSecret: 'other',
        screen: 'space',
        roomShellOpen: false,
      }),
    ).toBe('background');
  });

  it('room-only uses roomShellOpen', () => {
    expect(
      resolveCallSurface({
        inCall: true,
        boundSpaceSecret: null,
        focusedSecret: null,
        screen: 'home',
        roomShellOpen: true,
      }),
    ).toBe('room-shell');
    expect(
      resolveCallSurface({
        inCall: true,
        boundSpaceSecret: null,
        focusedSecret: null,
        screen: 'home',
        roomShellOpen: false,
      }),
    ).toBe('background');
  });
});
