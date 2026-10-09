/**
 * Typed live-chat payloads. Free path: text only.
 * `image-ref` reserved for paid team — free clients ignore/refuse.
 */

export type TextChatPayload = {
  kind: 'text';
  id: string;
  text: string;
  displayName: string;
  sentAt: number;
};

export type ImageRefChatPayload = {
  kind: 'image-ref';
  id: string;
  displayName: string;
  sentAt: number;
  ref: string;
  mime?: string;
};

export type ChatEnvelope = TextChatPayload | ImageRefChatPayload;

/** Outbound wire (typed). Inbound may still be legacy text-only — see normalizeInboundChat. */
export type ChatWire = ChatEnvelope;

export function textChatPayload(
  id: string,
  text: string,
  displayName: string,
  sentAt: number,
): TextChatPayload {
  return { kind: 'text', id, text, displayName, sentAt };
}

/** Normalize inbound wire; returns null if unusable or binary on free path. */
export function normalizeInboundChat(
  data: unknown,
  allowBinary: boolean,
): TextChatPayload | ImageRefChatPayload | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data as Record<string, unknown>;
  const id = typeof raw.id === 'string' ? raw.id : '';
  const displayName = typeof raw.displayName === 'string' ? raw.displayName : 'Peer';
  const sentAt = typeof raw.sentAt === 'number' ? raw.sentAt : Date.now();
  if (!id) return null;

  if (raw.kind === 'image-ref') {
    if (!allowBinary) return null;
    const ref = typeof raw.ref === 'string' ? raw.ref : '';
    if (!ref) return null;
    return {
      kind: 'image-ref',
      id,
      displayName,
      sentAt,
      ref,
      mime: typeof raw.mime === 'string' ? raw.mime : undefined,
    };
  }

  const text = typeof raw.text === 'string' ? raw.text : '';
  if (!text && raw.kind === 'text') return null;
  if (raw.kind === 'text' || typeof raw.text === 'string') {
    if (!text) return null;
    return { kind: 'text', id, text, displayName, sentAt };
  }
  return null;
}

export function chatPayloadToMessageText(payload: TextChatPayload | ImageRefChatPayload): string {
  if (payload.kind === 'text') return payload.text;
  return '[Image]';
}
