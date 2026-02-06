import { describe, it, expect } from 'vitest';

import { encodeSignature } from './useEIP712Sign';

describe('useEIP712Sign', () => {
  describe('encodeSignature', () => {
    it('should correctly parse valid signature', () => {
      // Valid signature: 0x (2) + r (64 hex chars) + s (64 hex chars) + v (2 hex chars) = 132 chars total
      // r = 32 bytes = 64 hex chars
      // s = 32 bytes = 64 hex chars  
      // v = 1 byte = 2 hex chars (1b = 27)
      const r = 'a'.repeat(64);
      const s = 'b'.repeat(64);
      const v = '1b';
      const signature = `0x${r}${s}${v}` as `0x${string}`;

      const result = encodeSignature(signature);

      expect(result.r).toBe(`0x${r}`);
      expect(result.s).toBe(`0x${s}`);
      expect(result.v).toBe(27); // 0x1b = 27
    });

    it('should throw error for invalid signature length', () => {
      const invalidSignature = '0x123456' as `0x${string}`;

      expect(() => encodeSignature(invalidSignature)).toThrow(
        'Invalid signature length',
      );
    });

    it('should handle v values correctly', () => {
      // Test v = 28 (0x1c)
      const signature1c = ('0x' +
        '1'.repeat(64) +
        '2'.repeat(64) +
        '1c') as `0x${string}`;
      const { v: v1c } = encodeSignature(signature1c);
      expect(v1c).toBe(28);

      // Test v = 27 (0x1b)
      const signature1b = ('0x' +
        '1'.repeat(64) +
        '2'.repeat(64) +
        '1b') as `0x${string}`;
      const { v: v1b } = encodeSignature(signature1b);
      expect(v1b).toBe(27);
    });
  });
});
