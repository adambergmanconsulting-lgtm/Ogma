import { describe, expect, it } from 'vitest';
import { listRemotePeers } from './peerState';

describe('listRemotePeers', () => {
  it('merges streams and connecting names', () => {
    const stream = {} as MediaStream;
    const streams = new Map([['a', stream]]);
    const names = new Map([
      ['a', 'Ada'],
      ['b', 'Bob'],
    ]);
    const list = listRemotePeers(streams, names);
    expect(list).toHaveLength(2);
    expect(list.find((p) => p.peerId === 'a')).toMatchObject({
      displayName: 'Ada',
      connectionState: 'connected',
    });
    expect(list.find((p) => p.peerId === 'b')).toMatchObject({
      displayName: 'Bob',
      connectionState: 'connecting',
      stream: null,
    });
  });

  it('marks a peer who is sharing a screen', () => {
    const streams = new Map([['a', {} as MediaStream]]);
    const names = new Map([['a', 'Ada']]);
    const sharing = new Map([['a', true]]);
    expect(listRemotePeers(streams, names, sharing)[0]?.sharingScreen).toBe(true);
  });
});
