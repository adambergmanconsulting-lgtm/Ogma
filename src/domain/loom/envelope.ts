import { openPayload as openSealPayload, sealPayload } from '../crypto/seal';
import type { LoomSealPayload } from '../crypto/seal';
import { bytesToB64Url } from '../crypto/bytes';
import {
  LOOM_ENVELOPE_V,
  MAX_PLAINTEXT_BYTES,
  type LoomEnvelope,
} from './types';

export type LoomPayload = LoomSealPayload;

export function newMessageId(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return `${Date.now().toString(36)}_${bytesToB64Url(bytes)}`;
}

async function sealWithPayload(
  spaceSecret: string,
  payload: LoomPayload,
  author: string,
  ts: number,
  id: string,
): Promise<LoomEnvelope> {
  const plainBytes = new TextEncoder().encode(JSON.stringify(payload));
  if (plainBytes.byteLength > MAX_PLAINTEXT_BYTES) {
    throw new Error('Message too long');
  }
  const { nonce, ciphertext } = await sealPayload(spaceSecret, payload);
  return {
    v: LOOM_ENVELOPE_V,
    id,
    ts,
    author,
    nonce,
    ciphertext,
  };
}

export async function sealTextMessage(
  spaceSecret: string,
  text: string,
  author: string,
  ts = Date.now(),
  id = newMessageId(),
): Promise<LoomEnvelope> {
  return sealWithPayload(spaceSecret, { kind: 'text', text }, author, ts, id);
}

export async function sealJoin(
  spaceSecret: string,
  author: string,
  ts = Date.now(),
  id = newMessageId(),
): Promise<LoomEnvelope> {
  return sealWithPayload(spaceSecret, { kind: 'join' }, author, ts, id);
}

/** @deprecated Prefer sealTextMessage — kept for existing call sites/tests. */
export async function sealEnvelope(
  spaceSecret: string,
  text: string,
  author: string,
  ts = Date.now(),
  id = newMessageId(),
): Promise<LoomEnvelope> {
  return sealTextMessage(spaceSecret, text, author, ts, id);
}

export async function openPayload(
  spaceSecret: string,
  env: LoomEnvelope,
): Promise<LoomPayload> {
  return openSealPayload(spaceSecret, env.nonce, env.ciphertext);
}

/** Opens text payloads only (throws on join). */
export async function openEnvelope(spaceSecret: string, env: LoomEnvelope): Promise<string> {
  const payload = await openPayload(spaceSecret, env);
  if (payload.kind !== 'text') throw new Error('Not a text payload');
  return payload.text;
}

export function previewFromPayload(author: string, payload: LoomPayload): string {
  if (payload.kind === 'join') return `${author} joined`;
  return payload.text;
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
