/** Locked system-line verbs — keep in sync with ui-naming.md. */

import {
  LOOM_SYSTEM_KINDS,
  isLoomSystemKind,
  type LoomSystemKind,
} from '../crypto/seal';

export { LOOM_SYSTEM_KINDS, isLoomSystemKind, type LoomSystemKind };

/** Trailing words after the author name (centered muted log line). */
export function systemLineVerb(kind: LoomSystemKind): string {
  switch (kind) {
    case 'join':
      return 'joined';
    case 'call-start':
      return 'started a call';
    case 'call-end':
      return 'ended the call';
    case 'screen-share':
      return 'shared a screen';
    case 'screen-share-end':
      return 'stopped sharing';
  }
}

export function systemLineLabel(author: string, kind: LoomSystemKind): string {
  const name = author.trim() || 'Someone';
  return `${name} ${systemLineVerb(kind)}`;
}
