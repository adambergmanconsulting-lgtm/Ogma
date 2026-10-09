import type { LoomStore } from './storePort';
import type { DeviceKeyMeta, SpaceIndexRow, StoredMessage } from './types';

const DB_NAME = 'ogma-loom-v1';
const DB_VERSION = 2;
const SPACES = 'spaces';
const MESSAGES = 'messages';
const COLD = 'messages-cold';
const META = 'meta';
const DEVICE_KEY_META = 'deviceKeyMeta';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SPACES)) {
        db.createObjectStore(SPACES, { keyPath: 'spaceId' });
      }
      if (!db.objectStoreNames.contains(MESSAGES)) {
        const msgs = db.createObjectStore(MESSAGES, { keyPath: 'id' });
        msgs.createIndex('bySpace', 'spaceId', { unique: false });
      }
      if (!db.objectStoreNames.contains(COLD)) {
        const cold = db.createObjectStore(COLD, { keyPath: 'id' });
        cold.createIndex('bySpace', 'spaceId', { unique: false });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

/** Browser IndexedDB LoomStore. */
export async function openIdbLoomStore(): Promise<LoomStore> {
  const db = await openDb();

  const getMessage: LoomStore['getMessage'] = async (id) => {
    const tx = db.transaction([MESSAGES, COLD], 'readonly');
    const hot = await reqToPromise(tx.objectStore(MESSAGES).get(id));
    if (hot) {
      await txDone(tx);
      return hot as StoredMessage;
    }
    const cold = await reqToPromise(tx.objectStore(COLD).get(id));
    await txDone(tx);
    return (cold as StoredMessage | undefined) ?? null;
  };

  const putMessage: LoomStore['putMessage'] = async (spaceId, env) => {
    const existing = await getMessage(env.id);
    if (existing) return false;
    const tx = db.transaction(MESSAGES, 'readwrite');
    tx.objectStore(MESSAGES).put({ ...env, spaceId } satisfies StoredMessage);
    await txDone(tx);
    return true;
  };

  const store: LoomStore = {
    async listSpaces() {
      const tx = db.transaction(SPACES, 'readonly');
      const rows = await reqToPromise(tx.objectStore(SPACES).getAll());
      await txDone(tx);
      return rows as SpaceIndexRow[];
    },
    async getSpace(spaceId) {
      const tx = db.transaction(SPACES, 'readonly');
      const row = await reqToPromise(tx.objectStore(SPACES).get(spaceId));
      await txDone(tx);
      return (row as SpaceIndexRow | undefined) ?? null;
    },
    async putSpace(row) {
      const tx = db.transaction(SPACES, 'readwrite');
      tx.objectStore(SPACES).put(row);
      await txDone(tx);
    },
    async deleteSpace(spaceId) {
      const tx = db.transaction([SPACES, MESSAGES, COLD], 'readwrite');
      tx.objectStore(SPACES).delete(spaceId);
      for (const storeName of [MESSAGES, COLD]) {
        const idx = tx.objectStore(storeName).index('bySpace');
        const keys = await reqToPromise(idx.getAllKeys(spaceId));
        for (const key of keys) tx.objectStore(storeName).delete(key);
      }
      await txDone(tx);
    },
    async listMessageIds(spaceId) {
      const tx = db.transaction([MESSAGES, COLD], 'readonly');
      const hot = (await reqToPromise(
        tx.objectStore(MESSAGES).index('bySpace').getAll(spaceId),
      )) as StoredMessage[];
      const cold = (await reqToPromise(
        tx.objectStore(COLD).index('bySpace').getAll(spaceId),
      )) as StoredMessage[];
      await txDone(tx);
      return [...hot, ...cold].map((r) => r.id);
    },
    async listMessages(spaceId) {
      const tx = db.transaction(MESSAGES, 'readonly');
      const idx = tx.objectStore(MESSAGES).index('bySpace');
      const rows = (await reqToPromise(idx.getAll(spaceId))) as StoredMessage[];
      await txDone(tx);
      return rows;
    },
    async listColdMessages(spaceId) {
      const tx = db.transaction(COLD, 'readonly');
      const idx = tx.objectStore(COLD).index('bySpace');
      const rows = (await reqToPromise(idx.getAll(spaceId))) as StoredMessage[];
      await txDone(tx);
      return rows;
    },
    getMessage,
    putMessage,
    async putMessages(spaceId, envs) {
      let n = 0;
      for (const env of envs) {
        if (await putMessage(spaceId, env)) n += 1;
      }
      return n;
    },
    async moveMessagesToCold(ids) {
      if (ids.length === 0) return;
      const tx = db.transaction([MESSAGES, COLD], 'readwrite');
      const hotStore = tx.objectStore(MESSAGES);
      const coldStore = tx.objectStore(COLD);
      for (const id of ids) {
        const row = (await reqToPromise(hotStore.get(id))) as StoredMessage | undefined;
        if (!row) continue;
        coldStore.put(row);
        hotStore.delete(id);
      }
      await txDone(tx);
    },
    async deleteMessages(ids) {
      if (ids.length === 0) return;
      const tx = db.transaction([MESSAGES, COLD], 'readwrite');
      for (const id of ids) {
        tx.objectStore(MESSAGES).delete(id);
        tx.objectStore(COLD).delete(id);
      }
      await txDone(tx);
    },
    async estimateBytes() {
      const tx = db.transaction([SPACES, MESSAGES, COLD], 'readonly');
      const spaces = await reqToPromise(tx.objectStore(SPACES).getAll());
      const messages = await reqToPromise(tx.objectStore(MESSAGES).getAll());
      const cold = await reqToPromise(tx.objectStore(COLD).getAll());
      await txDone(tx);
      return new TextEncoder().encode(JSON.stringify({ spaces, messages, cold })).byteLength;
    },
    async getDeviceKeyMeta() {
      const tx = db.transaction(META, 'readonly');
      const row = await reqToPromise(tx.objectStore(META).get(DEVICE_KEY_META));
      await txDone(tx);
      if (!row || typeof row !== 'object') return null;
      const meta = (row as { key: string; value: DeviceKeyMeta }).value;
      return meta ?? null;
    },
    async setDeviceKeyMeta(meta) {
      const tx = db.transaction(META, 'readwrite');
      if (!meta) {
        tx.objectStore(META).delete(DEVICE_KEY_META);
      } else {
        tx.objectStore(META).put({ key: DEVICE_KEY_META, value: meta });
      }
      await txDone(tx);
    },
  };
  return store;
}
