import { describe, expect, it, vi } from 'vitest';
import { listRemotePeers, syncLocalStream } from './peerState';
import type { ThreadSession } from './session';

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

  it('marks a peer whose mic is off', () => {
    const streams = new Map([['a', {} as MediaStream]]);
    const names = new Map([['a', 'Ada']]);
    const micOff = new Map([['a', true]]);
    expect(listRemotePeers(streams, names, new Map(), micOff)[0]?.micOff).toBe(true);
  });
});

describe('syncLocalStream', () => {
  function fakeTrack(kind: 'audio' | 'video', id: string): MediaStreamTrack {
    return { kind, id, readyState: 'live' } as MediaStreamTrack;
  }

  function fakeStream(tracks: MediaStreamTrack[]): MediaStream {
    return {
      getTracks: () => tracks,
      getVideoTracks: () => tracks.filter((t) => t.kind === 'video'),
      getAudioTracks: () => tracks.filter((t) => t.kind === 'audio'),
    } as MediaStream;
  }

  it('holds the published stream after a screen-share video swap', () => {
    const camVideo = fakeTrack('video', 'cam');
    const screen = fakeTrack('video', 'screen');
    const audio = fakeTrack('audio', 'mic');
    const camera = fakeStream([camVideo, audio]);
    const published = fakeStream([screen, audio]);
    const holdStream = vi.fn();
    const replaceTrack = vi.fn();
    const session = {
      addStream: vi.fn(),
      holdStream,
      replaceTrack,
    } as unknown as ThreadSession;

    syncLocalStream(session, camera, published);

    expect(replaceTrack).toHaveBeenCalledWith(camVideo, screen);
    expect(holdStream).toHaveBeenCalledWith(published);
    expect(session.addStream).not.toHaveBeenCalled();
  });
});
