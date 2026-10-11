import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDLE_WASH_QUIET_MS, armIdleWashReady } from './useIdleWashResting';

describe('armIdleWashReady', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays dark for the quiet window, then fires ready', () => {
    vi.useFakeTimers();
    const onReady = vi.fn();
    const cancel = armIdleWashReady(false, onReady);
    expect(onReady).not.toHaveBeenCalled();
    vi.advanceTimersByTime(IDLE_WASH_QUIET_MS - 1);
    expect(onReady).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onReady).toHaveBeenCalledOnce();
    cancel?.();
  });

  it('does not fire while held (Call)', () => {
    vi.useFakeTimers();
    const onReady = vi.fn();
    expect(armIdleWashReady(true, onReady)).toBeUndefined();
    vi.advanceTimersByTime(IDLE_WASH_QUIET_MS * 2);
    expect(onReady).not.toHaveBeenCalled();
  });

  it('cancel prevents a late ready after new activity', () => {
    vi.useFakeTimers();
    const onReady = vi.fn();
    const cancel = armIdleWashReady(false, onReady);
    vi.advanceTimersByTime(2000);
    cancel?.();
    const cancel2 = armIdleWashReady(false, onReady);
    vi.advanceTimersByTime(IDLE_WASH_QUIET_MS);
    expect(onReady).toHaveBeenCalledOnce();
    cancel2?.();
  });
});
