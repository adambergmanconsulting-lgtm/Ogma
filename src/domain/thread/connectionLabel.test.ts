import { describe, expect, it } from 'vitest';
import { connectionLabel } from './connectionLabel';

describe('connectionLabel', () => {
  it('humanizes non-connected states', () => {
    expect(connectionLabel('idle', 0, 0)).toBe('');
    expect(connectionLabel('joining', 0, 0)).toBe('Joining…');
    expect(connectionLabel('reconnecting', 0, 0)).toBe('Reconnecting…');
    expect(connectionLabel('left', 0, 0)).toBe('Left');
    expect(connectionLabel('error', 0, 0)).toBe("Couldn't connect");
    expect(connectionLabel('error', 0, 0, "Couldn't reach peers — network may block P2P.")).toBe(
      "Couldn't reach peers — network may block P2P.",
    );
  });

  it('keeps connected Waiting / Connecting / Connected rules', () => {
    expect(connectionLabel('connected', 1, 0)).toBe('Connected');
    expect(connectionLabel('connected', 0, 1)).toBe('Waiting…');
    expect(connectionLabel('connected', 0, 0)).toBe('Connecting…');
  });
});
