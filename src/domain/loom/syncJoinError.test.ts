import { describe, expect, it } from 'vitest';
import { loomJoinErrorIsActionable } from './sync';

describe('loomJoinErrorIsActionable', () => {
  it('surfaces join errors only when no peers are connected', () => {
    expect(loomJoinErrorIsActionable(0)).toBe(true);
    expect(loomJoinErrorIsActionable(1)).toBe(false);
    expect(loomJoinErrorIsActionable(2)).toBe(false);
  });
});
