import { describe, expect, it } from 'vitest';
import { threadSecretFromSpace } from './threadFromSpace';

describe('threadSecretFromSpace', () => {
  it('is stable for the same space and different across spaces', async () => {
    const a1 = await threadSecretFromSpace('space-a');
    const a2 = await threadSecretFromSpace('space-a');
    const b = await threadSecretFromSpace('space-b');
    expect(a1).toBe(a2);
    expect(a1).not.toBe(b);
    expect(a1).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
