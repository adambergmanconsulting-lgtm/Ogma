import { describe, expect, it } from 'vitest';
import { linkQualityLabel } from './linkQualityCopy';

describe('linkQualityLabel', () => {
  it('hides on good quality', () => {
    expect(linkQualityLabel('good', false, 'Ada')).toBeNull();
  });

  it('names the peer when known', () => {
    expect(linkQualityLabel('fair', false, 'Ada')).toBe(
      'Weak connection with Ada — lowering video',
    );
    expect(linkQualityLabel('poor', true, 'Ada')).toBe(
      'Weak connection with Ada — video paused',
    );
  });

  it('omits empty name', () => {
    expect(linkQualityLabel('fair', false, '  ')).toBe('Weak connection — lowering video');
    expect(linkQualityLabel('poor', true, null)).toBe('Weak connection — video paused');
  });
});
