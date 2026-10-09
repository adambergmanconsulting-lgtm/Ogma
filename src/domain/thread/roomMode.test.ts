import { describe, expect, it } from 'vitest';
import { allowsBinaryChat, isPaidTeamMode } from './roomMode';

describe('roomMode', () => {
  it('free refuses binaries; team allows', () => {
    expect(allowsBinaryChat('free')).toBe(false);
    expect(allowsBinaryChat('team')).toBe(true);
    expect(isPaidTeamMode('team')).toBe(true);
    expect(isPaidTeamMode('free')).toBe(false);
  });
});
