import { openIdbLoomStore } from './idbStore';
import { createMemoryLoomStore } from './memoryStore';
import type { LoomStore } from './storePort';

export type { LoomStore } from './storePort';
export { createMemoryLoomStore } from './memoryStore';

let singleton: Promise<LoomStore> | null = null;

/** Browser store (IndexedDB). Cached for the page lifetime. */
export function getLoomStore(): Promise<LoomStore> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(createMemoryLoomStore());
  }
  if (!singleton) singleton = openIdbLoomStore();
  return singleton;
}

/** Test helper: reset singleton between suites. */
export function resetLoomStoreSingleton(): void {
  singleton = null;
}
