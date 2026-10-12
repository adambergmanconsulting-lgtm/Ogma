import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isIncomingCallSoundActive,
  startIncomingCallSound,
  stopIncomingCallSound,
} from './callRingSound';

describe('callRingSound', () => {
  afterEach(() => {
    stopIncomingCallSound();
    vi.unstubAllGlobals();
  });

  it('no-ops when AudioContext is unavailable', () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);
    startIncomingCallSound();
    expect(isIncomingCallSoundActive()).toBe(false);
  });

  it('starts a loop and stop clears it', () => {
    const close = vi.fn(async () => undefined);
    const resume = vi.fn(async () => undefined);
    const connect = vi.fn();
    const start = vi.fn();
    const stop = vi.fn();
    const setValueAtTime = vi.fn();
    const exponentialRampToValueAtTime = vi.fn();

    class FakeOscillator {
      type = 'sine';
      frequency = { value: 0 };
      connect = connect;
      start = start;
      stop = stop;
    }
    class FakeGain {
      gain = { setValueAtTime, exponentialRampToValueAtTime };
      connect = connect;
    }
    class FakeAudioContext {
      currentTime = 0;
      state = 'running';
      destination = {};
      createOscillator = () => new FakeOscillator();
      createGain = () => new FakeGain();
      resume = resume;
      close = close;
    }

    vi.stubGlobal('AudioContext', FakeAudioContext);
    startIncomingCallSound();
    expect(isIncomingCallSoundActive()).toBe(true);
    expect(resume).toHaveBeenCalled();
    expect(start).toHaveBeenCalled();
    stopIncomingCallSound();
    expect(isIncomingCallSoundActive()).toBe(false);
    expect(close).toHaveBeenCalled();
  });
});
