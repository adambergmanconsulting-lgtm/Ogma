import { openText, sealText } from '../crypto/seal';
import { bytesToB64Url } from '../crypto/bytes';
import {
  LOOM_ENVELOPE_V,
  MAX_PLAINTEXT_BYTES,
  type LoomEnvelope,
} from './types';

export function newMessageId(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return `${Date.now().toString(36)}_${bytesToB64Url(bytes)}`;
}

export async function sealEnvelope(
  spaceSecret: string,
  text: string,
  author: string,
  ts = Date.now(),
  id = newMessageId(),
): Promise<LoomEnvelope> {
  const plainBytes = new TextEncoder().encode(JSON.stringify({ text }));
  if (plainBytes.byteLength > MAX_PLAINTEXT_BYTES) {
    throw new Error('Message too long');
  }
  const { nonce, ciphertext } = await sealText(spaceSecret, text);
  return {
    v: LOOM_ENVELOPE_V,
    id,
    ts,
    author,
    nonce,
    ciphertext,
  };
}

export async function openEnvelope(spaceSecret: string, env: LoomEnvelope): Promise<string> {
  return openText(spaceSecret, env.nonce, env.ciphertext);
}

export function compareEnvelopes(a: LoomEnvelope, b: LoomEnvelope): number {
  if (a.ts !== b.ts) return a.ts - b.ts;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function isLoomEnvelope(raw: unknown): raw is LoomEnvelope {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  return (
    o.v === LOOM_ENVELOPE_V &&
    typeof o.id === 'string' &&
    typeof o.ts === 'number' &&
    typeof o.author === 'string' &&
    typeof o.nonce === 'string' &&
    typeof o.ciphertext === 'string'
  );
}
