import { describe, expect, it } from 'vitest';
import {
  createDeviceKeyMeta,
  unlockDeviceKey,
  unwrapSpaceSecret,
  wrapSpaceSecret,
} from './deviceKey';

describe('device key', () => {
  it('wraps and unwraps a space secret', async () => {
    const meta = await createDeviceKeyMeta('correct horse');
    const key = await unlockDeviceKey('correct horse', meta);
    const wrapped = await wrapSpaceSecret(key, 'space-secret-xyz');
    expect(await unwrapSpaceSecret(key, wrapped)).toBe('space-secret-xyz');
  });

  it('rejects wrong passphrase', async () => {
    const meta = await createDeviceKeyMeta('right');
    await expect(unlockDeviceKey('wrong', meta)).rejects.toThrow();
  });
});
