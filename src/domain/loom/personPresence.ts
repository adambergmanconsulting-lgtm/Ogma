import { joinRoom } from '@trystero-p2p/torrent';
import { publicSpaceId } from '../crypto/seal';
import { buildIceServers } from '../thread/iceConfig';
import { THREAD_TRACKER_URLS } from '../thread/relayHealth';
import { verifyHere } from './personCard';

const LOOM_APP_ID = 'ogma-loom-v1';
const HERE_MS = 25_000;

export type PersonRoomWire =
  | { type: 'here'; personPublicB64: string; ts: number; sigB64: string }
  | { type: 'invite'; sealedB64: string };

export type PersonRoom = {
  leave: () => void;
  sendInvite: (sealedB64: string) => Promise<void>;
};

function isVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState === 'visible';
}

/** Public meeting place for one person id. The space secret is not in it. */
export async function personRoomKey(personPublicB64: string): Promise<string> {
  return `person:${await publicSpaceId(personPublicB64)}`;
}

/**
 * Sit in a person's meeting room.
 * `announce` is set only for this vault's own room.
 * A watcher marks them active when a fresh signed here arrives from a peer.
 */
export async function openPersonRoom(opts: {
  personPublicB64: string;
  announce?: () => Promise<{ ts: number; sigB64: string } | null>;
  onActive?: (active: boolean) => void;
  onInvite?: (sealedB64: string) => void;
}): Promise<PersonRoom> {
  const roomKey = await personRoomKey(opts.personPublicB64);
  const room = joinRoom(
    {
      appId: LOOM_APP_ID,
      rtcConfig: { iceServers: buildIceServers() },
      relayConfig: { urls: THREAD_TRACKER_URLS },
    },
    roomKey,
  );
  const action = room.makeAction<PersonRoomWire>('person');
  const herePeers = new Set<string>();

  const sendHere = async () => {
    if (!opts.announce || !isVisible()) return;
    const signed = await opts.announce();
    if (!signed) return;
    await action.send({
      type: 'here',
      personPublicB64: opts.personPublicB64,
      ts: signed.ts,
      sigB64: signed.sigB64,
    });
  };

  action.onMessage = (data, context) => {
    if (!data || typeof data !== 'object' || !isVisible()) return;
    if (data.type === 'invite' && typeof data.sealedB64 === 'string') {
      opts.onInvite?.(data.sealedB64);
      return;
    }
    if (data.type !== 'here' || data.personPublicB64 !== opts.personPublicB64) return;
    if (typeof data.ts !== 'number' || typeof data.sigB64 !== 'string') return;
    void verifyHere(data.personPublicB64, data.ts, data.sigB64).then((ok) => {
      if (!ok) return;
      herePeers.add(context.peerId);
      opts.onActive?.(true);
    });
  };

  room.onPeerJoin = () => {
    void sendHere();
  };
  room.onPeerLeave = (peerId) => {
    herePeers.delete(peerId);
    if (herePeers.size === 0) opts.onActive?.(false);
  };

  const timer = opts.announce ? setInterval(() => void sendHere(), HERE_MS) : null;
  void sendHere();

  return {
    leave: () => {
      if (timer) clearInterval(timer);
      action.onMessage = null;
      room.onPeerJoin = null;
      room.onPeerLeave = null;
      opts.onActive?.(false);
      void room.leave();
    },
    sendInvite: async (sealedB64: string) => {
      if (!isVisible()) return;
      await action.send({ type: 'invite', sealedB64 });
    },
  };
}
