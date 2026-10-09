import { describe, expect, it, vi } from 'vitest';
import { publishTracksToPeer, watchPeerTracks } from './peerMedia';

function mockPc(receivers: { track: MediaStreamTrack }[] = []) {
  const listeners = new Map<string, Set<EventListener>>();
  const senders: { track: MediaStreamTrack | null; replaceTrack: ReturnType<typeof vi.fn> }[] = [];
  return {
    getReceivers: () => receivers,
    getSenders: () => senders,
    addTrack: vi.fn((track: MediaStreamTrack) => {
      const sender = { track, replaceTrack: vi.fn() };
      senders.push(sender);
      return sender;
    }),
    addEventListener: (type: string, fn: EventListener) => {
      const set = listeners.get(type) ?? new Set();
      set.add(fn);
      listeners.set(type, set);
    },
    removeEventListener: (type: string, fn: EventListener) => {
      listeners.get(type)?.delete(fn);
    },
    emit(type: string, event: Event) {
      listeners.get(type)?.forEach((fn) => fn(event));
    },
  } as unknown as RTCPeerConnection & {
    emit: (type: string, event: Event) => void;
    addTrack: ReturnType<typeof vi.fn>;
  };
}

describe('watchPeerTracks', () => {
  it('emits when a track event fires', () => {
    class FakeMediaStream {
      tracks: MediaStreamTrack[] = [];
      addTrack(t: MediaStreamTrack) {
        this.tracks.push(t);
      }
      removeTrack(t: MediaStreamTrack) {
        this.tracks = this.tracks.filter((x) => x !== t);
      }
      getTracks() {
        return this.tracks;
      }
    }
    vi.stubGlobal('MediaStream', FakeMediaStream);

    const pc = mockPc();
    const onStream = vi.fn();
    const stop = watchPeerTracks(pc, 'peer-a', onStream);

    const track = {
      id: 'v1',
      readyState: 'live',
      kind: 'video',
      addEventListener: vi.fn(),
    } as unknown as MediaStreamTrack;

    pc.emit('track', { track, streams: [] } as unknown as Event);

    expect(onStream).toHaveBeenCalled();
    stop();
    vi.unstubAllGlobals();
  });
});

describe('publishTracksToPeer', () => {
  it('adds missing track kinds', () => {
    const pc = mockPc();
    const track = { id: 'a1', readyState: 'live', kind: 'audio' } as MediaStreamTrack;
    const stream = { getTracks: () => [track] } as unknown as MediaStream;
    publishTracksToPeer(pc, stream);
    expect(pc.addTrack).toHaveBeenCalledWith(track, stream);
  });
});
