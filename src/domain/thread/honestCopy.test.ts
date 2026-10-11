import { describe, expect, it } from 'vitest';
import {
  LOOM_HONEST_COPY,
  SITE_META_DESCRIPTION,
  THREAD_FREE_HONEST_COPY,
} from './honestCopy';

describe('honestCopy', () => {
  it('ships free-path Thread claims from overview', () => {
    expect(THREAD_FREE_HONEST_COPY).toMatch(/stay between peers/i);
    expect(THREAD_FREE_HONEST_COPY).toMatch(/no media or chat server/i);
    expect(THREAD_FREE_HONEST_COPY).toMatch(/Anyone with the link can join/i);
    expect(THREAD_FREE_HONEST_COPY).not.toMatch(/no servers/i);
    expect(THREAD_FREE_HONEST_COPY).not.toMatch(/anonymous/i);
  });

  it('ships Loom honest claims without overclaim words', () => {
    expect(LOOM_HONEST_COPY).toMatch(/encrypted with the chat invite/i);
    expect(LOOM_HONEST_COPY).toMatch(/catches up from peers/i);
    expect(LOOM_HONEST_COPY).toMatch(/no central copy/i);
    expect(LOOM_HONEST_COPY).toMatch(/Anyone with the space link/i);
    expect(LOOM_HONEST_COPY).not.toMatch(/fully anonymous/i);
    expect(LOOM_HONEST_COPY).not.toMatch(/\bE2EE\b/);
  });

  it('keeps public meta inside honest packaging', () => {
    expect(SITE_META_DESCRIPTION).toMatch(/peer-to-peer/i);
    expect(SITE_META_DESCRIPTION).toMatch(/no central media or chat database/i);
    expect(SITE_META_DESCRIPTION).not.toMatch(/serverless/i);
    expect(SITE_META_DESCRIPTION).not.toMatch(/anonymous/i);
  });
});
