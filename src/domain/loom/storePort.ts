import type { DeviceKeyMeta, LoomEnvelope, SpaceIndexRow, StoredMessage } from './types';

/** Persistence port — IndexedDB in browser, memory in tests. */
export interface LoomStore {
  listSpaces(): Promise<SpaceIndexRow[]>;
  getSpace(spaceId: string): Promise<SpaceIndexRow | null>;
  putSpace(row: SpaceIndexRow): Promise<void>;
  deleteSpace(spaceId: string): Promise<void>;

  /** Hot (working-set) message ids + cold ids — used for sync have/need. */
  listMessageIds(spaceId: string): Promise<string[]>;
  /** Hot messages only (newest keep-cap window). */
  listMessages(spaceId: string): Promise<StoredMessage[]>;
  /** Cold overflow messages for a space. */
  listColdMessages(spaceId: string): Promise<StoredMessage[]>;
  /** Hot or cold. */
  getMessage(id: string): Promise<StoredMessage | null>;
  /** Insert into hot if id unknown in hot or cold. Returns true when newly stored. */
  putMessage(spaceId: string, env: LoomEnvelope): Promise<boolean>;
  putMessages(spaceId: string, envs: LoomEnvelope[]): Promise<number>;
  /** Move hot messages to cold by id (local retention). */
  moveMessagesToCold(ids: string[]): Promise<void>;
  /** Remove from hot and/or cold. */
  deleteMessages(ids: string[]): Promise<void>;

  estimateBytes(): Promise<number>;

  getDeviceKeyMeta(): Promise<DeviceKeyMeta | null>;
  setDeviceKeyMeta(meta: DeviceKeyMeta | null): Promise<void>;
}
