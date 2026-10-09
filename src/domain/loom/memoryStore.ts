import type { LoomStore } from './storePort';
import type { DeviceKeyMeta, SpaceIndexRow, StoredMessage } from './types';

/** In-memory LoomStore for unit tests. */
export function createMemoryLoomStore(): LoomStore {
  const spaces = new Map<string, SpaceIndexRow>();
  const messages = new Map<string, StoredMessage>();
  const cold = new Map<string, StoredMessage>();
  let deviceKeyMeta: DeviceKeyMeta | null = null;

  return {
    async listSpaces() {
      return [...spaces.values()];
    },
    async getSpace(spaceId) {
      return spaces.get(spaceId) ?? null;
    },
    async putSpace(row) {
      spaces.set(row.spaceId, { ...row });
    },
    async deleteSpace(spaceId) {
      spaces.delete(spaceId);
      for (const [id, msg] of [...messages.entries()]) {
        if (msg.spaceId === spaceId) messages.delete(id);
      }
      for (const [id, msg] of [...cold.entries()]) {
        if (msg.spaceId === spaceId) cold.delete(id);
      }
    },
    async listMessageIds(spaceId) {
      const hot = [...messages.values()].filter((m) => m.spaceId === spaceId).map((m) => m.id);
      const c = [...cold.values()].filter((m) => m.spaceId === spaceId).map((m) => m.id);
      return [...hot, ...c];
    },
    async listMessages(spaceId) {
      return [...messages.values()].filter((m) => m.spaceId === spaceId);
    },
    async listColdMessages(spaceId) {
      return [...cold.values()].filter((m) => m.spaceId === spaceId);
    },
    async getMessage(id) {
      return messages.get(id) ?? cold.get(id) ?? null;
    },
    async putMessage(spaceId, env) {
      if (messages.has(env.id) || cold.has(env.id)) return false;
      messages.set(env.id, { ...env, spaceId });
      return true;
    },
    async putMessages(spaceId, envs) {
      let n = 0;
      for (const env of envs) {
        if (await this.putMessage(spaceId, env)) n += 1;
      }
      return n;
    },
    async moveMessagesToCold(ids) {
      for (const id of ids) {
        const row = messages.get(id);
        if (!row) continue;
        cold.set(id, row);
        messages.delete(id);
      }
    },
    async deleteMessages(ids) {
      for (const id of ids) {
        messages.delete(id);
        cold.delete(id);
      }
    },
    async estimateBytes() {
      const payload = JSON.stringify({
        spaces: [...spaces.values()],
        messages: [...messages.values()],
        cold: [...cold.values()],
      });
      return new TextEncoder().encode(payload).byteLength;
    },
    async getDeviceKeyMeta() {
      return deviceKeyMeta;
    },
    async setDeviceKeyMeta(meta) {
      deviceKeyMeta = meta ? { ...meta } : null;
    },
  };
}
