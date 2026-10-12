import { describe, expect, it } from 'vitest';
import {
  JOIN_PEERS_UNREACHABLE,
  JOIN_SIGNAL_DECRYPT_FAILED,
  joinErrorMessage,
} from './joinErrorMessage';

describe('joinErrorMessage', () => {
  it('reads Trystero JoinError.error (not .message)', () => {
    expect(
      joinErrorMessage({
        error: 'incorrect room password when decrypting offer',
        appId: 'ogma-loom-v1',
        roomId: 'loom:abc',
        peerId: 'peer1',
      }),
    ).toBe(JOIN_SIGNAL_DECRYPT_FAILED);
  });

  it('maps SDP/ICE failure to actionable Network help copy', () => {
    expect(
      joinErrorMessage({
        error:
          'could not connect to peer peer1 after exchanging SDP; configure TURN servers with turnConfig or rtcConfig.iceServers',
        appId: 'ogma-thread-v1',
        roomId: 'room',
        peerId: 'peer1',
      }),
    ).toBe(JOIN_PEERS_UNREACHABLE);
  });

  it('falls back when shape is empty or [object Object]', () => {
    expect(joinErrorMessage({})).toBe(JOIN_PEERS_UNREACHABLE);
    expect(joinErrorMessage('[object Object]')).toBe(JOIN_PEERS_UNREACHABLE);
    expect(joinErrorMessage({ message: 'tracker down' })).toBe('tracker down');
  });

  it('strips handshake failed prefix', () => {
    expect(joinErrorMessage({ error: 'handshake failed: timed out' })).toBe('timed out');
  });
});
