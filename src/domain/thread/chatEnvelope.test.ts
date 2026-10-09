import { describe, expect, it } from 'vitest';
import { normalizeInboundChat, textChatPayload } from './chatEnvelope';

describe('chatEnvelope', () => {
  it('normalizes typed text and legacy wire', () => {
    const typed = textChatPayload('1', 'hello', 'Ada', 1);
    expect(normalizeInboundChat(typed, false)).toEqual(typed);
    expect(
      normalizeInboundChat(
        { id: '2', text: 'legacy', displayName: 'Bob', sentAt: 2 },
        false,
      ),
    ).toEqual({
      kind: 'text',
      id: '2',
      text: 'legacy',
      displayName: 'Bob',
      sentAt: 2,
    });
  });

  it('refuses image-ref on free path', () => {
    const image = {
      kind: 'image-ref',
      id: 'i1',
      displayName: 'Ada',
      sentAt: 1,
      ref: 'blob:x',
    };
    expect(normalizeInboundChat(image, false)).toBeNull();
    expect(normalizeInboundChat(image, true)).toEqual(image);
  });
});
