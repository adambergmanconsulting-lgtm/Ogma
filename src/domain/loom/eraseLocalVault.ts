import { clearPeopleDirectory } from './peopleDirectory';
import type { LoomStore } from './storePort';

/** Wipe this browser profile’s Loom store + people directory (not other browsers). */
export async function eraseLocalVaultData(store: LoomStore): Promise<void> {
  await store.clearAll();
  clearPeopleDirectory();
}
