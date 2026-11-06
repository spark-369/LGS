import { describe, it, expect } from '@jest/globals';
import { escapeRegex, normalizeText } from '../../src/utils/strings.js';

describe('utils/strings', () => {
  describe('escapeRegex', () => {
    it('escapes every regex metacharacter', () => {
      expect(escapeRegex('a.b')).toBe('a\\.b');
      expect(escapeRegex('a*b')).toBe('a\\*b');
      expect(escapeRegex('a+b')).toBe('a\\+b');
      expect(escapeRegex('a?b')).toBe('a\\?b');
      expect(escapeRegex('a^b')).toBe('a\\^b');
      expect(escapeRegex('a$b')).toBe('a\\$b');
      expect(escapeRegex('a{b}')).toBe('a\\{b\\}');
      expect(escapeRegex('a(b)')).toBe('a\\(b\\)');
      expect(escapeRegex('a|b')).toBe('a\\|b');
      expect(escapeRegex('a[b]')).toBe('a\\[b\\]');
      expect(escapeRegex('a\\b')).toBe('a\\\\b');
    });

    it('neutralises a catastrophic-backtracking pattern', () => {
      // (a+)+$ is the classic ReDoS payload — after escaping it is inert.
      expect(escapeRegex('(a+)+$')).toBe('\\(a\\+\\)\\+\\$');
    });

    it('leaves safe text untouched', () => {
      expect(escapeRegex('NAND gate')).toBe('NAND gate');
    });

    it('coerces non-strings and defaults to empty', () => {
      expect(escapeRegex()).toBe('');
      expect(escapeRegex(123)).toBe('123');
      expect(escapeRegex(null)).toBe('null');
    });
  });

  describe('normalizeText', () => {
    it('collapses runs of whitespace and trims', () => {
      expect(normalizeText('  hello   world  ')).toBe('hello world');
      expect(normalizeText('a\n\t b')).toBe('a b');
    });

    it('defaults to an empty string', () => {
      expect(normalizeText()).toBe('');
      expect(normalizeText(42)).toBe('42');
    });
  });
});
