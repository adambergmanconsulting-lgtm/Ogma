import { describe, expect, it } from 'vitest';
import { shouldApplyUpdate } from './pwaUpdate';

describe('shouldApplyUpdate', () => {
  it('false when no refresh needed', () => {
    expect(shouldApplyUpdate({ needRefresh: false, inCall: false })).toBe(false);
    expect(shouldApplyUpdate({ needRefresh: false, inCall: true })).toBe(false);
  });

  it('holds while in a call', () => {
    expect(shouldApplyUpdate({ needRefresh: true, inCall: true })).toBe(false);
  });

  it('applies when refresh needed and not in a call', () => {
    expect(shouldApplyUpdate({ needRefresh: true, inCall: false })).toBe(true);
  });
});
