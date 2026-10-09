import { joinRoom } from '@trystero-p2p/torrent';
import { publicSpaceId } from '../crypto/seal';
import { ICE_SERVERS } from '../types';
import { THREAD_TRACKER_URLS } from '../thread/relayHealth';
import { isLoomEnvelope } from './envelope';
import type { LoomStore } from './storePort';
import type { LoomEnvelope, SyncWire } from './types';

const LOOM_APP_ID = 'ogma-loom-v1';
const CHUNK_MAX_ENTRIES = 32;

export type LoomSyncHandlers = {
  onEntries: (entries: LoomEnvelope[]) => void | Promise<void>;
  onPeerCount?: (n: number) => void;
  onError?: (message: string) => void;
};

export type LoomSyncSession = {
  spaceId: string;
  leave: () => void;
  broadcastHave: () => Promise<void>;
  sendEntries: (entries: LoomEnvelope[]) => Promise<void>;
};

function isVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState === 'visible';
}

/**
 * Peer have/need/entries sync for one space.
 * Seeding only while document is visible (loom-sync.md).
 */
export async function openLoomSync(
  spaceSecret: string,
  store: LoomStore,
  handlers: LoomSyncHandlers,
): Promise<LoomSyncSession> {
  const spaceId = await publicSpaceId(spaceSecret);
  const roomKey = `loom:${spaceId}`;

  const room = joinRoom(
    {
      appId: LOOM_APP_ID,
      rtcConfig: { iceServers: ICE_SERVERS },
      relayConfig: { urls: THREAD_TRACKER_URLS },
    },
    roomKey,
    {
      onJoinError: (err) => {
        const message =
          typeof err === 'object' && err && 'message' in err
            ? String((err as { message: unknown }).message)
            : String(err);
        handlers.onError?.(message || "Couldn't reach Loom peers.");
      },
    },
  );

  const sync = room.makeAction<SyncWire>('loomSync');

  const localIds = async () => store.listMessageIds(spaceId);

  const sendHave = async (peerId?: string) => {
    if (!isVisible()) return;
    const ids = await localIds();
    await sync.send({ type: 'have', ids }, peerId ? { target: peerId } : undefined);
  };

  const sendNeeded = async (want: string[], peerId: string) => {
    if (!isVisible() || want.length === 0) return;
    await sync.send({ type: 'need', ids: want }, { target: peerId });
  };

  const replyEntries = async (ids: string[], peerId: string) => {
    if (!isVisible()) return;
    const entries: LoomEnvelope[] = [];
    for (const id of ids) {
      const msg = await store.getMessage(id);
      if (msg && msg.spaceId === spaceId) {
        const { spaceId: _s, ...env } = msg;
        entries.push(env);
      }
      if (entries.length >= CHUNK_MAX_ENTRIES) {
        await sync.send({ type: 'entries', entries }, { target: peerId });
        entries.length = 0;
      }
    }
    if (entries.length) await sync.send({ type: 'entries', entries }, { target: peerId });
  };

  sync.onMessage = (data, context) => {
    if (!data || typeof data !== 'object' || !isVisible()) return;
    const peerId = context.peerId;
    void (async () => {
      if (data.type === 'have' && Array.isArray(data.ids)) {
        const have = new Set(await localIds());
        const need = data.ids.filter((id) => typeof id === 'string' && !have.has(id));
        await sendNeeded(need, peerId);
        return;
      }
      if (data.type === 'need' && Array.isArray(data.ids)) {
        const ids = data.ids.filter((id): id is string => typeof id === 'string');
        await replyEntries(ids, peerId);
        return;
      }
      if (data.type === 'entries' && Array.isArray(data.entries)) {
        const ok = data.entries.filter(isLoomEnvelope);
        if (ok.length) await handlers.onEntries(ok);
      }
    })();
  };

  const peerCount = () => Object.keys(room.getPeers()).length;

  room.onPeerJoin = (peerId) => {
    handlers.onPeerCount?.(peerCount());
    void sendHave(peerId);
  };
  room.onPeerLeave = () => handlers.onPeerCount?.(peerCount());

  void sendHave();

  return {
    spaceId,
    leave: () => {
      sync.onMessage = null;
      room.onPeerJoin = null;
      room.onPeerLeave = null;
      void room.leave();
    },
    broadcastHave: () => sendHave(),
    sendEntries: async (entries) => {
      if (!isVisible() || entries.length === 0) return;
      for (let i = 0; i < entries.length; i += CHUNK_MAX_ENTRIES) {
        await sync.send({ type: 'entries', entries: entries.slice(i, i + CHUNK_MAX_ENTRIES) });
      }
    },
  };
}
