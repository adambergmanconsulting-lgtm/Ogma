import { describe, expect, it } from 'vitest';
import { THREAD_FREE_HONEST_COPY } from './honestCopy';

describe('honestCopy', () => {
  it('ships free-path Thread claims from overview', () => {
    expect(THREAD_FREE_HONEST_COPY).toMatch(/stay between peers/i);
    expect(THREAD_FREE_HONEST_COPY).toMatch(/no media or chat server/i);
    expect(THREAD_FREE_HONEST_COPY).toMatch(/Anyone with the link can join/i);
    expect(THREAD_FREE_HONEST_COPY).not.toMatch(/no servers/i);
    expect(THREAD_FREE_HONEST_COPY).not.toMatch(/anonymous/i);
  });
});
