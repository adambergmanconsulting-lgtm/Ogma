import type { LoomStore } from './storePort';
import { SIZE_STRONG_WARN_BYTES, SIZE_WARN_BYTES } from './types';

export type SizeLevel = 'ok' | 'warn' | 'strong';

export async function localSizeLevel(store: LoomStore): Promise<{
  bytes: number;
  level: SizeLevel;
}> {
  const bytes = await store.estimateBytes();
  if (bytes >= SIZE_STRONG_WARN_BYTES) return { bytes, level: 'strong' };
  if (bytes >= SIZE_WARN_BYTES) return { bytes, level: 'warn' };
  return { bytes, level: 'ok' };
}
