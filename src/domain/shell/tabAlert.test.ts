import { afterEach, describe, expect, it, vi } from 'vitest';
import { pulseChatAlert, pulseCallAlert, startTabAlert, stopTabAlert } from './tabAlert';

function stubDocument(visibility: 'visible' | 'hidden' = 'visible') {
  const link = { href: '/favicon.svg' };
  const doc = {
    title: 'Ogma',
    visibilityState: visibility,
    querySelector: (sel: string) => (sel.includes('icon') ? link : null),
  };
  vi.stubGlobal('document', doc);
  return doc;
}

describe('tabAlert', () => {
  afterEach(() => {
    stopTabAlert();
    vi.unstubAllGlobals();
  });

  it('pulses vibrate for chat and call', () => {
    stubDocument('visible');
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    pulseChatAlert();
    expect(vibrate).toHaveBeenCalledWith(40);
    pulseCallAlert();
    expect(vibrate).toHaveBeenCalledWith([120, 80, 120, 80, 200]);
  });

  it('start/stop restore base title', () => {
    const doc = stubDocument('visible');
    startTabAlert('chat');
    expect(doc.title).toMatch(/New message|Ogma/);
    stopTabAlert();
    expect(doc.title).toBe('Ogma');
  });
});
