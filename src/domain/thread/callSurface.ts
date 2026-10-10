/** Where the live Thread UI should sit while `inCall`. */

export type CallSurface = 'space-call' | 'room-shell' | 'background' | 'none';

export function resolveCallSurface(opts: {
  inCall: boolean;
  boundSpaceSecret: string | null;
  focusedSecret: string | null;
  screen: string;
  /** Room-only CallShell is open (not soft-nav away). */
  roomShellOpen: boolean;
}): CallSurface {
  if (!opts.inCall) return 'none';
  if (opts.boundSpaceSecret) {
    if (opts.screen === 'space' && opts.focusedSecret === opts.boundSpaceSecret) {
      return 'space-call';
    }
    return 'background';
  }
  if (opts.roomShellOpen) return 'room-shell';
  return 'background';
}
